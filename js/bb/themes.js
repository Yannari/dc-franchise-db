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
 * listing it here, and adding an `.rp-theme-<id>` CSS block in simulator.html.
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
  const seen = new Set();
  const out = [];
  for (const act of theme.arc || []) {
    if (!act || !act.book) continue;
    // `fromEnd` counts back from the finale and is 1-indexed like `week` is:
    // `fromEnd: 1` IS the last week, `fromEnd: 2` the one before it.
    const ep = act.at?.week != null
      ? Number(act.at.week)
      : weeks - Number(act.at?.fromEnd ?? 1) + 1;
    if (!Number.isFinite(ep) || ep < 1 || ep > weeks) continue;
    if (yours.has(ep)) continue;
    const key = `${ep}:${act.book}`;
    if (seen.has(key)) continue;
    seen.add(key);
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
  if (!theme) return null;
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
