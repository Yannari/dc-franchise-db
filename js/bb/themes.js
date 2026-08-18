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
import { gs, seasonConfig, TWIST_CATALOG, twistModeClashes } from '../core.js';
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
import MACHINE from './themes-cora.js';
import MYSTERY from './themes-mystery.js';
import HIGH_ROLLERS from './themes-high-rollers.js';
import SUMMER_CAMP from './themes-summer-camp.js';

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
  [MACHINE.id]: MACHINE,
  [MYSTERY.id]: MYSTERY,
  [HIGH_ROLLERS.id]: HIGH_ROLLERS,
  [SUMMER_CAMP.id]: SUMMER_CAMP,
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
  // ── A SEASON IN PROGRESS IS THE THEME IT INSTALLED, NOT THE ONE IN THE BOX ──
  //
  // `seasonConfig.theme` is a PICKER; `gs.bb.theme` is what is actually running.
  // Reading the picker here made them two sources of truth for one fact, and
  // the config select saves on change while `prepareHouse` reinstalls every
  // episode — so switching from theme A to theme B in week five gave the house
  // B's voice pools, B's arc moods, B's id stamped on every act and B's reader
  // skin, all sitting on top of A's `gs.bb.theme` (A's id, A's mood, A's
  // bookings) with A's twists still on the schedule. `advanceThemeArc` walked
  // B's arc and mutated A's state. Nothing threw, and nothing anywhere asserted
  // that the two agreed.
  //
  // The installed theme wins, so the two cannot disagree. Changing the picker
  // mid-season now does what changing the venue mid-season does: nothing, until
  // the next season.
  const bb = gs?.bb;
  if (bb?.theme?.id) return themeById(bb.theme.id);
  // A season already under way that never installed a theme stays unthemed —
  // the case a pre-feature save lands in. Booking an arc onto weeks that have
  // already aired is not a theme, it is a rewrite of the season so far.
  if ((bb?.weeks?.length || 0) > 0) return null;
  return themeById(seasonConfig?.theme);
}

export function themeAccent() {
  return currentTheme()?.palette?.accent || DEFAULT_ACCENT;
}

/**
 * The season's own explanation of itself, or null when nothing is themed.
 *
 * Authored per theme, never assembled here. Everything that explains a season
 * to the viewer — the premiere card, the standing band, the screen the week
 * the register turns — reads this, so the engine can gain a fifth theme's
 * explanation without gaining a fifth branch.
 */
export function themePrimer() {
  return currentTheme()?.primer || null;
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
// Once per act per process. `themeScheduleEntries` is pure and gets called for
// every install and by every size-sweeping test, so an unguarded warn would
// bury its own message under thirteen copies of itself.
const _warned = new Set();
function _warnOnce(key, message) {
  if (_warned.has(key)) return;
  _warned.add(key);
  try { console.warn(message); } catch { /* no console, no warning, no harm */ }
}

/**
 * Resolve one anchor to a week number.
 *
 * Three forms, because a season is between nine and seventeen weeks long here
 * and no single one of them scales:
 *   `{week: n}`      counted from the premiere — for acts that belong to the
 *                    opening whatever the cast size.
 *   `{fromEnd: n}`   counted back from the last week, 1-indexed. It maps onto
 *                    house size identically at every cast: fromEnd 3 is always
 *                    a final six, fromEnd 2 always a final five.
 *   `{frac: 0..1}`   a proportion of the season. The escalation belongs about
 *                    two thirds in, and "week 6" is two thirds of a twelve-cast
 *                    season and barely a third of a twenty — which is how the
 *                    Den came to spend more of a long season hostile than calm.
 */
export function resolveArcWeek(at, weeks) {
  if (!at) return NaN;
  if (at.week != null) return Number(at.week);
  if (at.frac != null) {
    const w = Math.round(Number(weeks) * Number(at.frac));
    return Math.min(Math.max(w, 1), Number(weeks));
  }
  return Number(weeks) - Number(at.fromEnd ?? 1) + 1;
}

/**
 * Flatten an arc, expanding any act that recurs.
 *
 * A fixed list of five acts cannot fill a seventeen-week season: Summer of
 * Temptation opened with two offers, went silent for six to nine weeks, then
 * dumped everything into the endgame. Reported off a real timeline — twists
 * bunched into episodes 1-3 and 10-13 with nothing in between.
 *
 * `{ every: n, from: w, untilFromEnd: k }` says "an offer every n weeks from
 * week w, stopping before the endgame anchors take over". It expands in place,
 * so the authored running order — and the ordering guarantee below — still
 * holds.
 */
export function expandArc(arc, weeks) {
  const out = [];
  for (const act of arc || []) {
    if (!act) continue;
    if (!act.every) { out.push(act); continue; }
    const from = Math.max(1, Number(act.from ?? 1));
    const stop = act.untilFromEnd != null
      ? resolveArcWeek({ fromEnd: act.untilFromEnd }, weeks)
      : Number(weeks) + 1;
    for (let w = from; w < stop && w <= weeks; w += Number(act.every)) {
      out.push({ ...act, every: undefined, at: { week: w } });
    }
  }
  return out;
}

export function themeScheduleEntries(theme, { weeks = 10, existing = [] } = {}) {
  if (!theme) return [];
  const booked = (existing || []).filter(Boolean);
  const yours = new Set(booked.map(t => Number(t.episode)));
  const out = [];
  // The week the last theme act took. Everything below hangs off this.
  let lastEp = 0;
  for (const act of expandArc(theme.arc, weeks)) {
    if (!act || !act.book) continue;
    const ep = resolveArcWeek(act.at, weeks);
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
    if (ep <= lastEp) {
      // Say so. Dropping a colliding act is the right behaviour on a season too
      // short for the whole arc, but it is the WRONG behaviour to be silent
      // about when the arc itself is misordered — list `{fromEnd: 1}` above
      // `{week: 2}` and every fixed-week act below it disappears, on every cast
      // size, with no symptom to notice. The whole point of this engine is that
      // somebody else writes the themes.
      _warnOnce(`${theme.id}:${act.book}`,
        `theme "${theme.id}": the act booking ${act.book} resolved to week ${ep}, `
        + `at or before the act before it (week ${lastEp}), and was dropped. `
        + 'The arc is a running order — list acts in the order they should air. '
        + 'On a short season this is expected; on every cast size it is an authoring bug.');
      continue;
    }
    lastEp = ep;
    out.push({
      id: `th-${theme.id}-${ep}-${act.book}`,
      episode: ep,
      type: act.book,
      source: 'theme',
      // ── WHAT THE THEME WANTS THIS PARTICULAR CARD TO DO ──
      //
      // A booked card is an ordinary schedule entry, and several cards read
      // their own options off it: Whacktivity reads "doors", the High
      // Roller's Room reads "game", Pandora's Box reads its prize. Without
      // this a theme could say WHICH card to play and never which version of
      // it — so Summer Camp could book Whacktivity and never ask for the
      // three doors BB21 actually ran, which is the whole reason it books it.
      //
      // Spread FIRST, so nothing a theme puts here can overwrite the episode
      // or the type below it.
      ...(act.options || {}),
      // ── AN ENDGAME ACT IS ANCHORED TO THE HOUSE, NOT TO A COUNTED-BACK WEEK ──
      //
      // `fromEnd` is written as a house size — 3 is a final six — and the week
      // it resolves to here is only this schedule's PREDICTION of when a house
      // of that size will be standing. The prediction assumes a season is
      // `cast - 3` weeks and that every week evicts exactly one, and neither
      // holds in play: a measured seventeen-cast season ran sixteen weeks over
      // fifteen episodes with two weeks that evicted nobody, so every
      // end-anchored act aired one house size early. The double eviction landed
      // at a final eight and the season's closing act at a final six.
      //
      // So the entry carries the size it was written for, and `reanchorThemeArc`
      // moves it to whichever week the house actually reaches that size. The
      // episode stays a real editable number the whole way — the designer draws
      // it, the twist lookups read it — it is simply allowed to be corrected by
      // the season it is in.
      ...(act.at?.fromEnd != null
        ? { atHouse: Number(act.at.fromEnd) + 3, plannedEpisode: ep }
        : {}),
      ...(act.options || {}),
    });
  }
  return out;
}

/**
 * Put every end-anchored theme card back on its predicted week.
 *
 * `reanchorThemeArc` edits `episode` as a season plays, and the schedule it
 * edits is saved config that outlives the season. Without this, a second season
 * started from the same config opens with the first season's corrections baked
 * in and every card already marked as having fired — so the whole endgame is
 * skipped, silently, on every run after the first.
 */
export function resetThemeAnchors() {
  for (const entry of seasonConfig.twistSchedule || []) {
    if (!entry || entry.source !== 'theme') continue;
    if (entry.plannedEpisode != null) entry.episode = Number(entry.plannedEpisode);
    delete entry.themeFired;
  }
}

/**
 * Move this week's end-anchored theme cards onto this week.
 *
 * Called once per episode, before the twist lookup, with the house that is
 * about to play. A card fires when the house has shrunk to the size it was
 * written for — or past it, which is the case that matters: a double eviction
 * at a final six leaves a final four, and an act anchored at a final five would
 * otherwise wait for a week that never comes.
 *
 * At most one card moves onto any one week. Two acts due together are two acts
 * whose window the house crossed in one jump, and firing both would collapse
 * the authored escalation into a single night; the larger anchor goes first,
 * which is the earlier act, and the rest wait. That keeps the guarantee
 * `themeScheduleEntries` makes at authoring time — authored order is
 * chronological order — true in play as well as on paper.
 *
 * Returns the entries that FIRE this week — including one that was already
 * sitting on the right week and needed no correction, because "did this act
 * happen" is the question worth asking of it, not "did the date change".
 */
export function reanchorThemeArc(epNum, houseSize) {
  const sched = seasonConfig.twistSchedule;
  if (!Array.isArray(sched)) return [];
  const ep = Number(epNum);
  const live = Number(houseSize);
  if (!Number.isFinite(ep) || !Number.isFinite(live)) return [];
  const pending = sched.filter(e => e && e.source === 'theme'
    && !e.themeFired && Number.isFinite(Number(e.atHouse)));
  // Anything already due but not chosen this week must not fire on its
  // predicted episode either — it is waiting its turn, not sitting on a date.
  const due = pending.filter(e => live <= Number(e.atHouse))
    .sort((a, b) => Number(b.atHouse) - Number(a.atHouse));
  const now = due[0] || null;
  const fired = [];
  for (const entry of pending) {
    if (entry === now) {
      entry.themeFired = true;
      entry.episode = ep;
      fired.push(entry);
      continue;
    }
    // Not this week. If its prediction says otherwise, the prediction is the
    // thing that is wrong — push it clear rather than let it run early.
    if (Number(entry.episode) <= ep) entry.episode = ep + 1;
  }
  return fired;
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
/**
 * Lay the theme's arc onto the schedule NOW, at authoring time.
 *
 * The arc used to materialise on episode one, which meant the Format Designer
 * had nothing to show and a theme's twists were a black box you could look at
 * only after the season had started. They were always real schedule entries —
 * that was the point of writing entries rather than intercepting the lookup —
 * so the only thing standing between them and the designer was WHEN they were
 * written.
 *
 * Stamped, they are ordinary cards: delete the have-nots week, drag the double
 * eviction, change what is in the box, add five of your own around them. From
 * this moment the schedule belongs to whoever is editing it, and `installTheme`
 * will not touch it again — see the stamp check there.
 *
 * Returns the entries it added. Adds nothing without a cast, because the arc's
 * shape depends on how long the season is.
 */
export function stampThemeArc(castSize) {
  const theme = currentTheme();
  const yours = (seasonConfig.twistSchedule || []).filter(t => t?.source !== 'theme');
  if (!theme) {
    seasonConfig.twistSchedule = yours;
    seasonConfig.themeArcStamped = '';
    return [];
  }
  const weeks = Math.max(0, Number(castSize || 0) - 3);
  if (!weeks) return [];
  const entries = themeScheduleEntries(theme, { weeks, existing: yours });
  seasonConfig.twistSchedule = [...yours, ...entries];

  // ── SEASON-LONG TWISTS THE THEME TURNS ON ──────────────────────────────
  //
  // Some of what a theme needs is not a card on a week. The Saboteur is a
  // season knob — one houseguest takes a job from the audience every week and
  // the house is told only that a saboteur exists — and no arc could reach it,
  // so the Machine Summer's AI Instigator was described in a comment and never
  // happened.
  //
  // Applied at STAMP time, like the arc, and for the same reason: it lands
  // visibly in the config where you can see it, change it, or turn it off,
  // rather than being forced on at episode one by something you cannot
  // inspect. Never re-applied — once stamped, the settings are yours.
  for (const [key, value] of Object.entries(theme.seasonKnobs || {})) {
    seasonConfig[key] = value;
  }

  seasonConfig.themeArcStamped = theme.id;
  return entries;
}

/**
 * Which of this theme's own twists the season's settings will refuse.
 *
 * DERIVED, not declared. A theme could carry an `incompatibleModes` list of its
 * own, but it would be a second copy of something the cards already say, and
 * the copy would be the one that went stale — the arc gains an act, the list
 * does not, and the theme cheerfully promises a season it cannot deliver.
 *
 * The case this exists for: the Den of Temptation seats a third nominee, and so
 * does the Block Buster, so they cannot both own the block. Summer of
 * Temptation books the Den three times. Turn the Block Buster on and three
 * quarters of the arc is refused at `bbTwistsForWeek` — silently, and after the
 * cards are already sitting on the timeline looking like they will run.
 *
 * Returns `{ modes, cards }`, both empty when everything can run.
 */
export function themeModeConflicts(cfg) {
  const theme = currentTheme();
  const config = cfg || seasonConfig;
  if (!theme) return { modes: [], cards: [] };
  const modes = new Set();
  const cards = new Set();
  for (const act of theme.arc || []) {
    if (!act?.book) continue;
    const card = TWIST_CATALOG.find(c => c.id === act.book);
    if (!card) continue;
    const clash = twistModeClashes(card, config);
    if (clash.length) {
      clash.forEach(m => modes.add(m));
      cards.add(card.name || card.id);
    }
  }
  return { modes: [...modes], cards: [...cards] };
}

/** Has this theme's arc already been laid down for editing? */
export function themeArcIsStamped() {
  const theme = currentTheme();
  return !!theme && seasonConfig.themeArcStamped === theme.id;
}

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
  // Whatever is installed IS the season's theme — `currentTheme()` reads the
  // same field, so this can no longer be a DIFFERENT theme's descriptor asking
  // to move in on top of it.
  if (gs.bb.theme) return gs.bb.theme;
  // Never install into a season that has already played. `currentTheme()`
  // refuses this case too, so this is belt as well as braces; it is spelled out
  // because the failure it prevents is invisible — an arc quietly booking week
  // 2 and week 3 of a season currently in week 9.
  if ((gs.bb.weeks?.length || 0) > 0) return null;
  // Already stamped in the designer? Then the schedule is the user's, not
  // ours. Re-booking here would strip every theme card and lay the defaults
  // back down, silently undoing the edits that stamping exists to allow — a
  // deleted week reappearing and a changed prize reverting on the way into
  // episode one. Record the state the voice and the reader need, and leave the
  // schedule exactly as authored.
  if (seasonConfig.themeArcStamped === theme.id) {
    // A fresh season, on a schedule the last one may have corrected.
    resetThemeAnchors();
    gs.bb.theme = {
      id: theme.id,
      mood: theme.antagonist?.mood || 'neutral',
      booked: (seasonConfig.twistSchedule || [])
        .filter(t => t?.source === 'theme').map(t => t.type),
    };
    return gs.bb.theme;
  }
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
  // No `said: []`. It was carried from the original sketch of the antagonist as
  // something that remembered its own lines, nothing ever appended to it, and
  // an always-empty array on the season state is worse than no array — the next
  // theme author reads it as a transcript they can use.
  gs.bb.theme = {
    id: theme.id,
    mood: theme.antagonist?.mood || 'neutral',
    booked: entries.map(e => e.type),
  };
  return gs.bb.theme;
}

export function themeState() {
  return gs?.bb?.theme || null;
}

// Four points inside a week, and two on the last night.
//
// The finale runs through its own simulator, not simulateBBWeek, so an
// antagonist wired only into the weekly hooks escalates for eight weeks, gets
// everybody to the end, and then is not there for any of it. `finale` opens
// the night; `crown` is the last word, after the jury has spoken.
const VOICE_HOOKS = ['open', 'noms', 'veto', 'vote', 'finale', 'crown'];

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
  // The last night names people who are still there and one who has just won,
  // so both go through the same roster check as everybody else.
  const finalists = (ctx.finalists || []).filter(Boolean);
  if (tpl.includes('{finalists}') && (!finalists.length || finalists.some(n => !inHouse(n, roster)))) return null;
  if (tpl.includes('{winner}') && !ctx.winner) return null;
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
    .replace(/\{evicted\}/g, ctx.evicted || '')
    .replace(/\{finalists\}/g, finalists.length > 1
      ? `${finalists.slice(0, -1).join(', ')} and ${finalists[finalists.length - 1]}`
      : (finalists[0] || ''))
    .replace(/\{winner\}/g, ctx.winner || '');
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
    const ep = resolveArcWeek(act.at, totalWeeks);
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
  // A Split House runs two half-weeks that are the same CALENDAR week, and both
  // of them now correctly say so — which means without a discriminator the seed
  // is identical on both sides and the antagonist says exactly the same sentence
  // to two halves of the house on the same night. The side is only mixed in when
  // there IS one, so every unsplit week keeps the seed it already had and a
  // seeded season still replays byte for byte.
  const rng = ctx.side
    ? stableRng('theme-voice', gs?.bb?.seasonSalt || 0, theme.id, hook, st.mood,
      ctx.week || 0, ctx.side)
    : stableRng('theme-voice', gs?.bb?.seasonSalt || 0, theme.id, hook, st.mood,
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

/**
 * Let the season antagonist read a public rule that its own arc booked.
 *
 * This deliberately accepts an announcement produced by twist-contract.js,
 * rather than looking the twist up in the catalog. The contract has already
 * removed anything the house is not allowed to know (a secret holder, a
 * Pandora prize, a Whacktivity winner); catalog copy has not. No announcement
 * in means no antagonist line out.
 */
export function themeTwistAnnouncement(announcement, ctx = {}) {
  const theme = currentTheme();
  const st = themeState();
  const week = Number(ctx.week || 0);
  if (!theme || !st || !announcement?.twist || !week) return null;

  const owned = (seasonConfig.twistSchedule || []).some(entry =>
    entry?.source === 'theme'
    && Number(entry.episode) === week
    && entry.type === announcement.twist);
  if (!owned) return null;

  const rule = String(announcement.rule || '').trim();
  if (!rule) return null;
  const name = String(announcement.name || 'This twist').trim();
  const sting = String(announcement.sting || '').trim();
  const detail = `${name}: ${rule}${sting ? ` ${sting}` : ''}`;
  // ── THE WORDS COME FROM THE THEME, NOT FROM A BRANCH IN HERE ──────────
  //
  // This used to be `theme.id === 'machine-summer' ? [CORA's lines] : [the
  // Den's lines]`, which meant every theme that was not CORA announced its
  // twists in the DEN's voice. A hotel said "the Den has changed the terms of
  // this week"; a casino said it too. That is the exact bug class this
  // codebase's own instructions open with — one season's vocabulary printed
  // over another's — and it was sitting in the engine that exists to prevent
  // it, which is why the rule is worth restating here: NOTHING in themes.js
  // may branch on a theme id. A fifth theme brings its own words or it gets
  // none.
  //
  // No pool means no line, deliberately. Falling back to another theme's words
  // is what this function used to do and is worse than saying nothing.
  const pools = (theme.primer?.announce || [])
    .map(line => String(line).replace('{detail}', detail));
  if (!pools.length) return null;
  const rng = stableRng('theme-twist-announcement', gs?.bb?.seasonSalt || 0,
    theme.id, st.mood, week, announcement.twist, ctx.side || '');
  return {
    speaker: theme.antagonist?.name || 'The Voice',
    line: pools[Math.floor(rng() * pools.length)],
    mood: st.mood,
    themeId: theme.id,
  };
}
