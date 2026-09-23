// ══════════════════════════════════════════════════════════════════════
// pm/schedule.js — the season's episodes, built from the cast
// ══════════════════════════════════════════════════════════════════════
//
// Spec §3. A season is a SPINE — the first coupling, Casa Amor, the photos,
// the semi-final, the final and the reunion — with villa weeks between, and
// how many weeks there are follows the cast: every bombshell the author casts
// has to walk in, and there have to be enough dumpings to reach four couples
// at the final. Real seasons scale the same way (UK 11: 38 islanders, eight
// weeks). The author can also set the length (VILLA OPTIONS); arrivals are
// then packed into fewer episodes, or quiet recoupling weeks added.
//
// THE CALIBRATION CASE. The default 22-islander cast (10 starters, 6
// bombshells, 6 Casa arrivals) builds EXACTLY the sixteen episodes the season
// was tuned on — SEASON_TEMPLATE below, which tests/pm-schedule.test.js holds
// the builder to. Everything else is that season stretched or shrunk.
//
// `rituals` are the villa's set pieces (spec §6.9), run by villa-day.js on
// the night they belong to. Arrivals are drawn from the season's queues in
// cast order; an empty queue skips the arrival.
export const SEASON_TEMPLATE = [
  { ep: 1, days: [1, 2], moment: 'first-coupling', arrivals: { bombshell: 1 } },
  { ep: 2, days: [3, 5], moment: 'recoupling' },
  { ep: 3, days: [6, 8], moment: 'bombshell', arrivals: { bombshell: 1 }, rituals: ['heart-rate'] },
  { ep: 4, days: [9, 11], moment: 'recoupling' },
  { ep: 5, days: [12, 14], moment: 'public-vote', slot: 'vote1', dumpFormat: 'cross-gender', bottom: 2 },
  { ep: 6, days: [15, 17], moment: 'bombshell', arrivals: { bombshell: 2 } },
  { ep: 7, days: [18, 20], moment: 'recoupling', rituals: ['snog-marry-pie'] },
  { ep: 8, days: [21, 23], moment: 'casa-open' },
  { ep: 9, days: [24, 26], moment: 'casa-nights' },
  { ep: 10, days: [27, 28], moment: 'stick-or-twist' },
  { ep: 11, days: [29, 31], moment: 'photos', arrivals: { bombshell: 1 }, rituals: ['movie-night'] },
  { ep: 12, days: [32, 34], moment: 'public-vote', slot: 'vote2', dumpFormat: 'safe-pick-couple', bottom: 3 },
  { ep: 13, days: [35, 37], moment: 'recoupling', arrivals: { bombshell: 1 }, rituals: ['notes'], keepSingles: true },
  { ep: 14, days: [38, 40], moment: 'semi-final', slot: 'semi', rituals: ['families'] },
  { ep: 15, days: [41, 43], moment: 'final' },
  { ep: 16, days: null, moment: 'reunion' },
];
export const FINAL_COUPLES = 4;

// ── WHO IS WHO, WHEN THE AUTHOR LEFT IT BLANK ─────────────────────────
// By cast position: about 45% start the villa (6 to 12, always even), Casa
// Amor takes about a quarter once the cast is 20 or more (up to 12), and the
// rest are bombshells. At 22 that is the 10 / 6 / 6 the season was tuned on.
export function defaultRoleSplit(n) {
  const starters = Math.max(6, Math.min(12, 2 * Math.round(n * 0.45 / 2)));
  const casa = n >= 20 ? Math.min(12, Math.round(n * 0.27)) : 0;
  return { starters, casa, bombshells: Math.max(0, n - starters - casa) };
}
export function defaultRoleFor(i, n) {
  const { starters, bombshells } = defaultRoleSplit(n);
  return i < starters ? 'starter' : i < starters + bombshells ? 'bombshell' : 'casa';
}

const COUNT_KEY = { starter: 'starters', bombshell: 'bombshells', casa: 'casa' };
/**
 * Every islander's role. `fixed[i]` is the role the author set on islander i
 * (Cast tab), or null. `counts` is VILLA OPTIONS' Starters / Bombshells /
 * Casa Amor, each a number or null (automatic). Set roles always stand; the
 * rest are filled in cast order — starters, then bombshells, then Casa —
 * to the counts, with any count left automatic sharing what is left in the
 * automatic proportions. All automatic is exactly defaultRoleFor.
 */
export function assignRoles(fixed, counts = {}) {
  const n = fixed.length;
  const auto = defaultRoleSplit(n);
  const num = k => (Number.isInteger(counts?.[k]) && counts[k] >= 0 ? counts[k] : null);
  const want = { starters: num('starters'), bombshells: num('bombshells'), casa: num('casa') };
  const open = Object.keys(want).filter(k => want[k] == null);
  const left = Math.max(0, n - Object.values(want).reduce((s, v) => s + (v || 0), 0));
  const autoTotal = open.reduce((s, k) => s + auto[k], 0);
  let rem = left;
  open.forEach((k, i) => {
    want[k] = i === open.length - 1 ? rem : Math.round(left * (autoTotal ? auto[k] / autoTotal : 1 / open.length));
    rem -= want[k];
  });
  // Starters left automatic stay even (they couple up on night one): the odd
  // one out becomes a bombshell.
  if (open.includes('starters') && want.starters % 2 === 1) { want.starters--; want.bombshells++; }
  const need = { ...want };
  for (const r of fixed) if (r) need[COUNT_KEY[r]]--;
  return fixed.map(r => {
    if (r) return r;
    for (const role of ['starter', 'bombshell', 'casa']) if (need[COUNT_KEY[role]] > 0) { need[COUNT_KEY[role]]--; return role; }
    // More islanders than the counts place: the spares are bombshells, who
    // always have a night to walk in on.
    return 'bombshell';
  });
}

// ── THE BUILDER ───────────────────────────────────────────────────────
// A week is one episode. Bombshells fill the arrival slots in running order;
// a slot's `cap` is how many walk in there at most.
const BASE_BOMBSHELLS = 6;   // the arrival slots of the calibration season
const MAX_EPISODES = 40;

function baseWeeks(casa) {
  const pre = [
    { moment: 'first-coupling', cap: 1, fixed: true },
    { moment: 'recoupling', drop: 3 },
    { moment: 'bombshell', cap: 1, rituals: ['heart-rate'] },
    { moment: 'recoupling', drop: 2 },
    { moment: 'public-vote', slot: 'vote1', fixed: true },
    { moment: 'bombshell', cap: 2 },
    { moment: 'recoupling', rituals: ['snog-marry-pie'], drop: 4, anchorPre: true },
  ];
  const casaWeeks = casa > 0 ? [
    { moment: 'casa-open', fixed: true },
    { moment: 'casa-nights', fixed: true },
    { moment: 'stick-or-twist', fixed: true, days: 2 },
    { moment: 'photos', cap: 1, rituals: ['movie-night'], fixed: true },
  ] : [];
  // With no Casa there are no photos to show: Movie Night moves to the vote.
  const post = [
    { moment: 'public-vote', slot: 'vote2', fixed: true, ...(casa > 0 ? {} : { rituals: ['movie-night'] }) },
    // Without Casa the photos' arrival slot is gone, so this night takes two.
    { moment: 'recoupling', cap: casa > 0 ? 1 : 2, rituals: ['notes'], keepSingles: true, fixed: true, anchorPost: true },
  ];
  const end = [
    { moment: 'semi-final', slot: 'semi', rituals: ['families'], fixed: true },
    { moment: 'final', fixed: true },
    { moment: 'reunion', fixed: true, days: 0 },
  ];
  return [...pre, ...casaWeeks, ...post, ...end];
}

/** Insert `week` before the anchor (pre-Casa or the last recoupling), alternating. */
function insertWeek(weeks, week, pre) {
  const at = weeks.findIndex(w => (pre ? w.anchorPre : w.anchorPost));
  weeks.splice(at < 0 ? weeks.length - 3 : at, 0, week);
}

/**
 * The season's episodes for a cast of `bombshells` and `casa` arrivals.
 * `episodes` (optional) is the author's length; otherwise it is automatic.
 */
export function buildSchedule({ bombshells = BASE_BOMBSHELLS, casa = 6, episodes = null } = {}) {
  const weeks = baseWeeks(casa);
  // More bombshells than the calibration season has slots for: a week each
  // pair — a bombshell night, then a recoupling — alternating before and
  // after Casa Amor, and every second one a public vote, so the dumpings keep
  // pace with the arrivals.
  const extraPairs = Math.ceil(Math.max(0, bombshells - BASE_BOMBSHELLS) / 2);
  const perSide = { pre: 0, post: 0 };
  for (let k = 0; k < extraPairs; k++) {
    const pre = k % 2 === 0 || casa === 0;
    const side = pre ? 'pre' : 'post';
    // Every second pair on a side dumps by public vote, the rest recouple.
    const dump = perSide[side]++ % 2 === 1 ? { moment: 'public-vote', slot: 'vote-extra', extra: true }
      : { moment: 'recoupling', extra: true };
    const bomb = { moment: 'bombshell', cap: 2, extra: true };
    // Both go in before the side's anchor, in the order that keeps the weeks
    // alternating: before Casa the anchor follows a bombshell night, so the
    // dumping goes first; after it the anchor follows a vote, so the arrival does.
    if (pre) { insertWeek(weeks, dump, true); insertWeek(weeks, bomb, true); }
    else { insertWeek(weeks, bomb, false); insertWeek(weeks, dump, false); }
  }
  // Fill the arrival slots in running order.
  let left = bombshells;
  for (const w of weeks) if (w.cap) { w.arrive = Math.min(w.cap, left); left -= w.arrive; }
  // A bombshell night nobody arrives on is not an episode.
  let out = weeks.filter(w => !(w.moment === 'bombshell' && !w.arrive));

  // The author's length.
  const target = episodes ? Math.max(minimumEpisodes(casa), Math.min(MAX_EPISODES, Math.round(episodes))) : null;
  while (target && out.length < target) {
    // Quiet villa weeks: a recoupling, before and after Casa in turn.
    const pre = out.filter(w => w.quiet).length % 2 === 0 || casa === 0;
    insertWeek(out, { moment: 'recoupling', quiet: true }, pre);
  }
  while (target && out.length > target) {
    // Take out the least necessary week; its arrivals join the next week
    // that takes arrivals (or the previous, at the end).
    const order = w => (w.quiet ? 0 : w.extra && w.moment !== 'bombshell' ? 1 : w.extra ? 2 : w.drop || 99);
    const cut = out.map((w, i) => [w, i]).filter(([w]) => !w.fixed).sort((a, b) => order(a[0]) - order(b[0]))[0];
    if (!cut) break;
    const [w, i] = cut;
    out.splice(i, 1);
    if (w.arrive) {
      const next = out.slice(i).find(x => x.cap != null) || [...out.slice(0, i)].reverse().find(x => x.cap != null);
      if (next) { next.arrive = (next.arrive || 0) + w.arrive; next.cap = Math.max(next.cap, next.arrive); }
    }
  }

  // Number them, and give them days: two for the first night and the Casa
  // recoupling, three for the rest; the reunion has none.
  let day = 0;
  return out.map((w, i) => {
    const len = w.days ?? (i === 0 ? 2 : 3);
    const e = { ep: i + 1, days: len ? [day + 1, day + len] : null, moment: w.moment };
    day += len;
    if (w.cap != null && w.arrive != null && (w.moment !== 'bombshell' || w.arrive)) {
      if (w.arrive || w.moment === 'first-coupling' || w.moment === 'photos' || w.keepSingles) e.arrivals = { bombshell: w.arrive || 0 };
    }
    if (w.moment === 'bombshell') e.arrivals = { bombshell: w.arrive };
    if (w.slot) e.slot = w.slot;
    if (w.rituals) e.rituals = [...w.rituals];
    if (w.keepSingles) e.keepSingles = true;
    return e;
  });
}

/** The shortest season the spine allows. */
export function minimumEpisodes(casa = 6) {
  return baseWeeks(casa).filter(w => w.fixed).length;
}

// ── HOW EACH DUMPING PLAYS (Plan 4.5) ─────────────────────────────────
// What is drawn is HOW each dumping plays, weighted by how often eight real
// seasons did it (UK 5, 9-13; US 6-8; the table is in
// docs/superpowers/plans/2026-09-22-perfect-match-plan-4.5-twists.md).
// Keyed by SLOT, not episode number, because the numbers move with the cast.
//
// `bottom` travels with the format: a favourite couple choosing between two
// couples is not a choice, and a save-one night needs three at risk to send
// two home — the same two exits the cross-gender night it replaces makes.
export const DUMP_DRAWS = {
  vote1: [['cross-gender', 3, 2], ['top-couple-picks', 3, 3], ['save-one', 2, 3], ['public', 1, 2]],
  vote2: [['safe-pick-couple', 2, 3], ['top-couple-picks', 3, 3], ['couples-vote', 2, 2], ['public', 2, 3]],
  semi: [['public', 1], ['ex-islanders', 1]],
};
// A big cast's extra public votes draw from the second vote's formats.
const drawsFor = slot => DUMP_DRAWS[slot === 'vote-extra' ? 'vote2' : slot] || null;
// What each episode is called on the Season Timeline, and its colour family.
export const EPISODE_WORDS = { 'first-coupling': 'First coupling', recoupling: 'Recoupling', bombshell: 'Bombshell',
  'public-vote': 'Vote', 'casa-open': 'Casa opens', 'casa-nights': 'Casa Amor', 'stick-or-twist': 'Stick or twist',
  photos: 'The photos', 'semi-final': 'Semi-final', final: 'Final', reunion: 'Reunion' };
export const EPISODE_KIND = { 'first-coupling': 'couple', recoupling: 'couple', bombshell: 'bomb', 'public-vote': 'vote',
  'casa-open': 'casa', 'casa-nights': 'casa', 'stick-or-twist': 'casa', photos: 'casa', 'semi-final': 'end',
  final: 'end', reunion: 'quiet' };
// The villa's set pieces, by name, for the Season Timeline (user: "when is
// movie night? there's no indication").
export const RITUAL_NAMES = { 'heart-rate': 'Heart Rate', 'snog-marry-pie': 'Snog Marry Pie', 'movie-night': 'Movie Night',
  notes: 'The notes', families: 'The families' };
export const SLOT_NAMES = { vote1: 'the first public vote', vote2: 'the second public vote', semi: 'the semi-final' };

function draw(rng, options) {
  const total = options.reduce((s, o) => s + o[1], 0);
  let r = rng() * total;
  for (const o of options) if ((r -= o[1]) < 0) return o;
  return options[options.length - 1];
}

// ── HOW THE ARRIVALS PLAY (Plan 4.5 phase 2) ──────────────────────────
// A bombshell night is usually dates and nothing else; the real show turns
// about one a season into something sharper, and never the same one twice.
// Read from the same eight seasons: a stand-up steal (UK 12 d24, US 7 d3,
// US 8 d3), a bombshell who saves one of the singles (UK 12 d9, US 6 d27,
// US 8 d10), the public coupling the bombshells (US 7 d11, US 8 d10).
export const ARRIVAL_DRAWS = [['dates', 6], ['stand-up', 1.5], ['saves', 1.5], ['public-matches', 1]];
// Night one: the girls stepping forward is the usual; the others are one
// season each (UK 12 profiles, UK 10 the public, UK 11 most-to-least).
export const FIRST_DRAWS = [['step-forward', 5], ['profiles', 1], ['public', 1], ['ranking', 1]];
// Phase 3: the twists a season plays at most once, with the chance a season
// gets each and the nights it can land on. At most two a season. Read from
// the same eight: returning islanders in 2 (UK 10, UK 12), the secret mission
// in 1 (UK 13), the sleepover villa in 1 (UK 12), immunity in 1 (US 8).
export const ONE_OFF_DRAWS = [
  ['return', 0.3, e => (e.moment === 'bombshell' || e.moment === 'recoupling') && e.ep >= 4],
  ['mission', 0.15, e => e.moment === 'bombshell'],
  ['sleepover', 0.2, e => e.moment === 'bombshell' && (e.arrivals?.bombshell || 0) >= 2],
  ['immunity', 0.25, e => e.moment === 'public-vote'],
];
export const MAX_ONE_OFFS = 2;

// Phase 4: the afternoon's named challenge (pm/challenges.js). Each is drawn
// for a season with the chance four real seasons (UK 10-13) played it, on a
// day in the part of the season they played it in — `at` is how far through
// the season, 0 to 1, from their day numbers against a ~57-day series. One a
// day. The heart-rate and Snog Marry Pie days already have their game.
export const CHALLENGE_NAMES = {
  receipts: 'Got the Receipts', 'look-who': "Look Who's Talking", snogger: 'Sauciest Snogger',
  'couple-goals': 'Couple Goals', 'knowing-me': 'Knowing Me, Knowing You', talent: 'The talent show',
  baby: 'The baby dolls', 'couple-of-sorts': 'Couple of Sorts', grafties: 'The Grafties',
  'lie-detector': 'The Lie Detector',
};
const VILLA_DAYS = new Set(['recoupling', 'bombshell', 'public-vote', 'photos', 'semi-final']);
export const CHALLENGE_DRAWS = [
  // guess-who cards: all four seasons, days 2-21
  ['receipts', 0.75, at => at < 0.4],
  ['look-who', 0.4, at => at < 0.55],
  // the kissing challenge: all four, days 12-41
  ['snogger', 0.85, at => at > 0.15 && at < 0.8],
  // the partner quiz: all four, days 15-52
  ['knowing-me', 0.7, at => at > 0.3],
  // Couple Goals: all four, days 31-50
  ['couple-goals', 0.85, at => at > 0.5],
  // the public's rankings: UK 11 d52, UK 12 d38
  ['couple-of-sorts', 0.4, at => at > 0.55],
  // the last week's entertainment: talent (three of four), dolls (one)
  ['talent', 0.65, at => at > 0.7],
  ['baby', 0.35, at => at > 0.7],
  // the awards night: one season, on a vote
  ['grafties', 0.2, (at, e) => at > 0.5 && e.moment === 'public-vote'],
  // The Lie Detector: every season 2015-2018 (UK 1-4 d34-51, AU 1 d37), then
  // dropped over welfare concerns — here an occasional late game. Drawn last,
  // so adding it moved none of the draws above.
  ['lie-detector', 0.3, at => at > 0.55],
];
// Which nights can have one at all, for the Season Timeline too.
export const CHALLENGE_NIGHTS = [...VILLA_DAYS];
const hasGame = e => (e.rituals || []).some(r => r === 'heart-rate' || r === 'snog-marry-pie');

/** The season's formats, drawn once from its own stream: same seed, same season. */
export function seasonSchedule(rng, template = SEASON_TEMPLATE) {
  const out = template.map(e => {
    const opts = e.slot && drawsFor(e.slot);
    if (!opts) return { ...e };
    const [dumpFormat, , bottom] = draw(rng, opts);
    const row = { ...e, dumpFormat };
    if (bottom) row.bottom = bottom; else delete row.bottom;
    return row;
  });
  // The arrivals draw AFTER every vote, so adding them moved no season's
  // dumpings. A rule that has played once this season is not drawn again.
  const used = new Set();
  for (const e of out) {
    if (e.moment === 'first-coupling') e.firstFormat = draw(rng, FIRST_DRAWS)[0];
    if (e.moment === 'bombshell') {
      const rule = draw(rng, ARRIVAL_DRAWS.filter(([r]) => r === 'dates' || !used.has(r)))[0];
      if (rule !== 'dates') { used.add(rule); e.arrivalRule = rule; }
    }
  }
  // …and the one-offs after those, for the same reason: each on a night of
  // its kind nobody else has taken, and never more than two a season.
  let taken = 0;
  for (const [kind, chance, fits] of ONE_OFF_DRAWS) {
    const roll = rng(), where = rng();
    if (taken >= MAX_ONE_OFFS || roll >= chance) continue;
    const nights = out.filter(e => fits(e) && !e.oneOff && !e.immunity);
    if (!nights.length) continue;
    const e = nights[Math.floor(where * nights.length)];
    if (kind === 'immunity') e.immunity = true; else e.oneOff = kind;
    taken++;
  }
  // …and the challenges last of all, so no earlier draw moved.
  const last = Math.max(1, ...out.map(e => e.ep));
  for (const [id, chance, fits] of CHALLENGE_DRAWS) {
    const roll = rng(), where = rng();
    if (roll >= chance) continue;
    const days = out.filter(e => VILLA_DAYS.has(e.moment) && !e.challenge && !hasGame(e) && fits((e.ep - 1) / last, e));
    if (!days.length) continue;
    days[Math.floor(where * days.length)].challenge = id;
  }
  return out;
}

// ── THE AUTHOR'S PICKS ────────────────────────────────────────────────
// Any drawn slot can be pinned from the Setup tab (VILLA OPTIONS). The draw
// still runs in full first, so pinning the first vote never moves what the
// second would have drawn. A pick is LIVE, not a promise made at the
// premiere: the run tab rebuilds the unaired episodes when one changes, and a
// pick for an episode that already aired takes effect when it is re-run.
export const PICK_LABELS = {
  'cross-gender': 'Public bottom per side; the other side dumps one each',
  'top-couple-picks': "The public's favourite couple decides",
  'save-one': "The public's bottom three; the other side saves one",
  public: 'Straight public vote',
  'safe-pick-couple': 'Public bottom couples; the safe islanders pick',
  'couples-vote': 'No public: the couples name the least compatible',
  'ex-islanders': 'The dumped islanders come back and decide',
  // Not pickable: what a vote night plays when the villa is already down to
  // four couples and still has singles to lose.
  singles: 'The single islanders face the public',
};

/**
 * Bookings from the Season Timeline that are not a vote slot's format: an
 * arrival rule or a first-coupling format, by episode ({ 6: { arrivalRule:
 * 'stand-up' } }). The caller has already checked the episode is the right
 * kind of night; an unknown key is ignored.
 */
export function withBookings(schedule, byEp = {}) {
  // A challenge booked on one night is not also played on the night it was drawn for.
  const booked = new Set(Object.values(byEp || {}).map(b => b?.challenge).filter(Boolean));
  // A set piece booked somewhere (Movie Night) moves there: its own night loses it.
  const ritualsBooked = new Set(Object.values(byEp || {}).flatMap(b => b?.rituals || []));
  return schedule.map(e => {
    const b = byEp?.[e.ep];
    if (!b?.challenge && booked.has(e.challenge)) { e = { ...e }; delete e.challenge; }
    if (ritualsBooked.size && (e.rituals || []).some(r => ritualsBooked.has(r))) {
      e = { ...e, rituals: e.rituals.filter(r => !ritualsBooked.has(r)) };
      if (!e.rituals.length) delete e.rituals;
    }
    if (b?.rituals && VILLA_DAYS.has(e.moment)) e = { ...e, rituals: [...new Set([...(e.rituals || []), ...b.rituals])] };
    if (!b) return e;
    const out = { ...e };
    if (b.arrivalRule && e.moment === 'bombshell') out.arrivalRule = b.arrivalRule === 'dates' ? undefined : b.arrivalRule;
    if (b.firstFormat && e.moment === 'first-coupling') out.firstFormat = b.firstFormat;
    if (b.oneOff) out.oneOff = b.oneOff;
    if (b.immunity && e.moment === 'public-vote') out.immunity = true;
    if (b.challenge && VILLA_DAYS.has(e.moment)) out.challenge = b.challenge;
    if (out.arrivalRule === undefined) delete out.arrivalRule;
    return out;
  });
}

/**
 * A night booked as "a random challenge" (the Season Timeline's Villa
 * Challenge card, left on Random): one that fits that part of the season and
 * is not already on the schedule, drawn on its own dice. Nothing fits: the
 * one fewest nights already have.
 */
export function resolveRandomGames(schedule, rng) {
  const last = Math.max(1, ...schedule.map(e => e.ep));
  const taken = new Set(schedule.map(e => e.challenge).filter(c => c && c !== 'random'));
  return schedule.map(e => {
    if (e.challenge !== 'random') return e;
    const at = (e.ep - 1) / last;
    const fits = CHALLENGE_DRAWS.filter(([id, , ok]) => !taken.has(id) && ok(at, e)).map(([id]) => id);
    const pool = fits.length ? fits : CHALLENGE_DRAWS.map(([id]) => id).filter(id => !taken.has(id));
    const id = pool.length ? pool[Math.floor(rng() * pool.length)] : null;
    if (id) taken.add(id);
    const out = { ...e };
    if (id) out.challenge = id; else delete out.challenge;
    return out;
  });
}

export function withPicks(schedule, picks = {}) {
  return schedule.map(e => {
    const want = e.slot && picks?.[e.slot];
    const opt = want && DUMP_DRAWS[e.slot]?.find(o => o[0] === want);
    if (!opt) return e;
    const [dumpFormat, , bottom] = opt;
    const out = { ...e, dumpFormat };
    if (bottom) out.bottom = bottom; else delete out.bottom;
    return out;
  });
}
