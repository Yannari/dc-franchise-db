// js/bb/themes.js — SEASON THEMES.
//
// A house season with twists but no theme is a list of rules. Every modern
// Big Brother season is sold on a premise instead, and on the real show the
// premise is not decoration — it is the container the twists arrive in. The
// Multiverse gave each bedroom a bucket of twists; AINSLEY *was* the
// rule-changing engine and turned heel in Week 10; the Mastermind kidnapped
// the host on night one and then marched the house to a final three.
//
// So a theme here is a SEASON AUTHOR, and it owns four things:
//   1. IDENTITY — palette, fonts, vocab, and which of the four houses it is in.
//   2. AN ANTAGONIST — a named voice that reads real simulation state. This is
//      the one thing the broadcast cannot do and we can: an antagonist who
//      names the alliance that actually formed last night.
//   3. AN ARC — week-indexed acts that book twists onto the schedule, so you
//      pick a theme instead of hand-booking twelve cards.
//   4. TWIST AFFINITY — what it books, weights, bans, and what only it can run.
//
// The descriptor carries no house vocabulary in its STRUCTURE (acts are indexed
// by episode, twists by catalog id), so a Total Drama theme later needs content
// rather than a second engine.
import { gs, seasonConfig } from '../core.js';
import { stableRng } from './knowledge.js';

/** The accent the reader uses when a season has no theme. */
export const DEFAULT_ACCENT = '#f0c040';

// Each theme is a plain descriptor in its own file, imported here.
//
// NOT a `registerTheme()` call from inside the theme file: that is a circular
// import, and ES modules hoist imports, so the theme module would run before
// this one's body and hit `BB_THEMES` in the temporal dead zone —
// a ReferenceError on the very first import. The dependency points one way
// only: theme files know nothing about the registry, the registry collects
// them.
import TEMPTATION from './themes-temptation.js';

/**
 * Every theme, by id.
 *
 * Themes are authored in code and picked in config; there is deliberately no
 * theme editor. Add one by writing its descriptor file, importing it above,
 * listing it here, and adding an `.rp-theme-<id>` CSS block in
 * css/simulator.css (beside the `.rp-set-*` venue skin it stacks on).
 */
export const BB_THEMES = {
  [TEMPTATION.id]: TEMPTATION,
};

export const THEME_LIST = Object.keys(BB_THEMES);

export function themeById(id) {
  return (id && BB_THEMES[id]) || null;
}

/**
 * The theme this season is actually running.
 *
 * Guarded on format for the same reason `houseSetting()` is: a season carried
 * over from Total Drama can still be pointing at a house theme, and nothing on
 * a beach should start quoting an AI.
 */
export function currentTheme() {
  if (seasonConfig?.format !== 'big-brother') return null;
  return themeById(seasonConfig?.theme);
}

export function themeAccent() {
  return currentTheme()?.palette?.accent || DEFAULT_ACCENT;
}

/**
 * The weeks a theme's arc lands on.
 *
 * Pure, because the interesting cases are all about what it REFUSES to emit:
 * an act past the end of a short season, and any week you booked yourself.
 * A week you booked is yours — the arc fills the gaps, it does not argue.
 *
 * `at` is either `{week: n}` counted from the premiere or `{fromEnd: n}`
 * counted back from the finale, because an endgame act belongs at the endgame
 * whether the house cast twelve or sixteen.
 */
export function themeScheduleEntries(theme, { weeks = 10, existing = [] } = {}) {
  if (!theme) return [];
  const booked = (existing || []).filter(Boolean);
  const yours = new Set(booked.map(t => Number(t.episode)));
  const out = [];
  // The week the last theme act took. Everything below hangs off this.
  let lastEp = 0;
  for (const act of theme.arc || []) {
    if (!act || !act.book) continue;
    // `fromEnd` counts back from the finale and is 1-indexed like `week` is:
    // `fromEnd: 1` IS the last week, `fromEnd: 2` the one before it.
    const ep = act.at?.week != null
      ? Number(act.at.week)
      : weeks - Number(act.at?.fromEnd ?? 1) + 1;
    if (!Number.isFinite(ep) || ep < 1 || ep > weeks) continue;
    if (yours.has(ep)) continue;
    // ── THE ARC IS A RUNNING ORDER, NOT A SET OF INDEPENDENT PINS ──
    //
    // An arc mixes absolute weeks with `fromEnd` weeks, and the gap between
    // them is the cast size. That is fine at the size the arc was written for
    // and quietly wrong at every other: on an eleven-house season Summer of
    // Temptation put the Den and Pandora's Box in the same week; on ten, the
    // Den and the double eviction; on seven, the box landed in WEEK ONE. The
    // old dedupe key was `episode:book`, so two DIFFERENT acts colliding on one
    // week was not a collision at all. Nothing crashed — the authored
    // escalation simply inverted, and the bill arrived before the offer.
    //
    // So an act is refused if its week is already spoken for, or if it would
    // land on or before the act that is supposed to precede it. Authored order
    // IS chronological order, guaranteed, for every theme and every cast size,
    // rather than a convention each author has to re-derive by hand.
    //
    // REFUSED, never shifted. Moving a late act forward to the next free week
    // is the tempting repair and it is wrong: the acts that collide on a short
    // season are the `fromEnd` ones, and `fromEnd` exists precisely because
    // those acts have a legal window — a double eviction below a house of six
    // is refused by the engine outright. Pushed forward, it would not run late;
    // it would not run. A season too short for the whole arc gets the front of
    // it, in order, and is missing the tail, which is legible. A season with
    // the tail on backwards is not.
    if (ep <= lastEp) continue;
    lastEp = ep;
    out.push({
      id: `th-${theme.id}-${ep}-${act.book}`,
      episode: ep,
      type: act.book,
      source: 'theme',
      ...(act.options || {}),
    });
  }
  return out;
}

/**
 * Every schedule entry a theme wrote, gone — and nothing else.
 *
 * The `source` tag is the whole mechanism: the arc writes it, the user never
 * does, so "a week you booked is yours" survives both the rebook below and the
 * sweep above.
 */
function stripThemeBookings() {
  const sched = seasonConfig.twistSchedule;
  if (!Array.isArray(sched) || !sched.some(t => t?.source === 'theme')) return;
  seasonConfig.twistSchedule = sched.filter(t => t?.source !== 'theme');
}

/**
 * Install the season's theme, once.
 *
 * Writes real schedule entries rather than intercepting the twist lookup,
 * because a twist's OPTIONS are read off its scheduled entry in a dozen places
 * (`boxEntry`, `deEntry`, the App Store shelf) and an intercept would have to
 * reimplement all of them. Everything downstream — `bbTwistsForWeek`,
 * `resolveTwistSchedule`, the Format Designer — keeps working untouched.
 */
export function installTheme(houseSize) {
  const theme = currentTheme();
  // Turning a theme OFF has to do work, which is why this is not an early
  // return. `seasonConfig.twistSchedule` is persisted by the UI, so the moment
  // the picker goes back to "No theme" the previous theme's bookings are still
  // sitting on the config with nothing left to own them — and they still fire.
  // The user switched the theme off and the theme kept playing. Same `source`
  // tag, same guarantee: nothing you booked is ever tagged, so nothing you
  // booked is swept up here.
  if (!theme) {
    stripThemeBookings();
    return null;
  }
  if (!gs.bb) return null;
  if (gs.bb.theme) return gs.bb.theme;
  // A house loses one a week and ends at three.
  const weeks = Math.max(1, Number(houseSize || 0) - 3);
  // The surrounding UI persists `seasonConfig.twistSchedule` between runs, so a
  // second season started from a saved config opens with the FIRST season's
  // theme bookings already sitting on it. Left in place they look exactly like
  // weeks you booked yourself, the arc politely refuses to argue with them, and
  // the theme ends up with an empty `booked` list while its twists run anyway —
  // state that claims credit for nothing, which is the state Task 3's
  // antagonist reads. So strip our own leavings first. That is what the
  // `source` tag is for: nothing you booked is ever tagged, so nothing you
  // booked is touched, and "a week you booked is yours" still holds after.
  const yours = (seasonConfig.twistSchedule || []).filter(t => t?.source !== 'theme');
  const entries = themeScheduleEntries(theme, { weeks, existing: yours });
  seasonConfig.twistSchedule = [...yours, ...entries];
  gs.bb.theme = {
    id: theme.id,
    mood: theme.antagonist?.mood || 'neutral',
    booked: entries.map(e => e.type),
    said: [],
  };
  return gs.bb.theme;
}

export function themeState() {
  return gs?.bb?.theme || null;
}

const VOICE_HOOKS = ['open', 'noms', 'veto', 'vote'];

/**
 * The house, as the antagonist is allowed to know it.
 *
 * `roster` is the week's OWN house when the caller has one, and only falls back
 * to `gs.activePlayers` when it does not. That is not belt-and-braces: on a
 * Split House cycle the week engine plays a half-house passed in as
 * `options.house`, and while `bb-run.js` currently narrows `gs.activePlayers`
 * to the side for the duration, nothing in this file can see that promise or
 * hold it. If it ever slipped, a perfectly legitimate `{nominees}` line would
 * be refused, the pool walk would fall through to the least specific line in
 * the pool, and the antagonist would read as thin writing rather than as a bug
 * — no error, no failing test. The fallback is what keeps `themeVoice` callable
 * with no roster at all, which the unit tests rely on.
 */
function inHouse(name, roster) {
  const live = (Array.isArray(roster) && roster.length) ? roster : (gs.activePlayers || []);
  return !!name && live.includes(name);
}

/**
 * Fill a line's tokens, or refuse to.
 *
 * Returns null rather than a half-filled line if any name token resolves to
 * somebody who is not in the house. An antagonist who taunts an evicted
 * houseguest is worse than an antagonist who says nothing, and the alternative
 * — trusting every caller to pass a live roster — is the bug we would find in
 * a played season rather than a test.
 *
 * The tokens are deliberately all STATE: a line that can be written before the
 * season starts is a line the broadcast could already do. `{cursed}` is the one
 * that earns the theme — it is the houseguest a Den curse seated in a third
 * chair, and it only resolves in a week where somebody actually accepted.
 */
function fillLine(tpl, ctx) {
  const noms = (ctx.nominees || []).filter(Boolean);
  const roster = ctx.house;
  if (tpl.includes('{hoh}') && !inHouse(ctx.hoh, roster)) return null;
  if (tpl.includes('{veto}') && !inHouse(ctx.veto, roster)) return null;
  if (tpl.includes('{cursed}') && !inHouse(ctx.cursed, roster)) return null;
  if (tpl.includes('{nominees}') && (!noms.length || noms.some(n => !inHouse(n, roster)))) return null;
  if (tpl.includes('{evicted}') && !ctx.evicted) return null;
  // Not a name — the shape of the count, e.g. "5-2". A line that reads the
  // margin is reading something the HOUSE did, which is the register the
  // antagonist is for; a line that reads a name is only a substitution.
  if (tpl.includes('{margin}') && !ctx.margin) return null;
  const list = noms.length > 1
    ? `${noms.slice(0, -1).join(', ')} and ${noms[noms.length - 1]}`
    : (noms[0] || '');
  return tpl
    .replace(/\{week\}/g, String(ctx.week ?? ''))
    .replace(/\{hoh\}/g, ctx.hoh || '')
    .replace(/\{veto\}/g, ctx.veto || '')
    .replace(/\{cursed\}/g, ctx.cursed || '')
    .replace(/\{nominees\}/g, list)
    .replace(/\{margin\}/g, ctx.margin || '')
    .replace(/\{evicted\}/g, ctx.evicted || '');
}

/** Move the antagonist's register. This is how a heel turn is expressed. */
export function setThemeMood(mood) {
  const st = themeState();
  if (st) st.mood = mood;
  return mood;
}

/**
 * Apply any non-booking arc acts scheduled for this week.
 *
 * Mood changes are the arc's other job. `themeScheduleEntries` skips an act
 * with no `book`, which is correct — it writes twist entries and a mood is not
 * one — so the acts that only move the register need somebody to read them, and
 * that somebody has to be the week, because a mood change is a thing that
 * happens AT a week rather than a thing written onto a schedule.
 *
 * A heel turn is a register change plus a palette change, not a second
 * character: `mood` is the only thing this moves, and both the voice pools and
 * the reader's `is-hostile` styling key off it.
 *
 * `fromEnd` is 1-indexed here exactly as it is in `themeScheduleEntries` — the
 * two must agree or an arc would read one way for its bookings and another for
 * its moods.
 */
export function advanceThemeArc(weekNum, totalWeeks) {
  const theme = currentTheme();
  const st = themeState();
  if (!theme || !st) return null;
  for (const act of theme.arc || []) {
    if (!act || !act.mood) continue;
    const ep = act.at?.week != null
      ? Number(act.at.week)
      : Number(totalWeeks) - Number(act.at?.fromEnd ?? 1) + 1;
    if (!Number.isFinite(ep)) continue;
    if (Number(weekNum) === ep) setThemeMood(act.mood);
  }
  return st.mood;
}

/**
 * What the antagonist says at one of the four fixed points in a week.
 *
 * Seeded on theme + hook + week, so the same season replays with the same
 * taunts and an extra unrelated die roll earlier in the week cannot change
 * them.
 *
 * The season's own salt is in the key as well. Without it the seed is a pure
 * function of the DESCRIPTOR, so every season anybody ever runs on this theme
 * opens week 4 with the same sentence — the theme would have a script rather
 * than a voice. The salt is drawn once per season from the season's dice
 * (week.js, `gs.bb.seasonSalt`) and is therefore itself stable under replay,
 * which is the same trade `bbThreatProfile`'s quirk term makes. A season that
 * has not drawn one yet falls back to 0 and simply speaks unsalted.
 */
export function themeVoice(hook, ctx = {}) {
  const theme = currentTheme();
  const st = themeState();
  if (!theme || !st) return null;
  if (!VOICE_HOOKS.includes(hook)) return null;
  const byMood = theme.antagonist?.voice?.[hook];
  if (!byMood) return null;
  const pool = byMood[st.mood] || byMood.neutral;
  if (!pool || !pool.length) return null;
  const rng = stableRng('theme-voice', gs?.bb?.seasonSalt || 0, theme.id, hook, st.mood,
    ctx.week || 0);
  // Walk the pool from a seeded start so a refused line falls through to the
  // next candidate instead of silencing the hook.
  const start = Math.floor(rng() * pool.length);
  for (let i = 0; i < pool.length; i++) {
    const line = fillLine(pool[(start + i) % pool.length], ctx);
    if (line) return { speaker: theme.antagonist.name, line, mood: st.mood, hook };
  }
  return null;
}

/** The same line, as an act the week can push and the transcripts can read. */
export function themeBeat(hook, ctx = {}) {
  const said = themeVoice(hook, ctx);
  if (!said) return null;
  return {
    type: 'theme-beat',
    hook: said.hook,
    speaker: said.speaker,
    line: said.line,
    mood: said.mood,
    themeId: currentTheme()?.id || null,
    players: [],
    badgeText: said.speaker,
    badgeClass: 'badge-twist',
  };
}
