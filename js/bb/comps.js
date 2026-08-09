// Big Brother competition dispatcher and contract.
// Production competition modules live in js/bb-comps/ and are passed in as a
// library. This file owns selection, the generic fallback, validation and the
// debug envelope shared by both paths.
import { gs, seasonConfig } from '../core.js';
import { pStats } from '../players.js';
import { addBond } from '../bonds.js';
import { shouldThrowHoh, shouldThrowVeto, gunningFor } from './strategy.js';

// 'return' is the Battle Back slot: no scheduler opens it yet, but the
// signature library already declares which competitions can serve a
// re-entry night (The Wall canonically is one), so the twist arrives to a
// stocked shelf instead of a contract change.
// 'pair' is the Battle of the Block slot: four nominees who are two units, not
// four players. It is a type of its own rather than a flag on 'arena' because
// nothing written for one nominee coming off the block alone can serve a night
// where the block comes off in twos — the arena's own closing beats announced
// each player's fate individually, and the week had to strip them back out.
// 'final' is the last Head of Household, parts one and two. A type of its own
// because these two must never be drawable for a weekly slot: the wall runs to
// six hours and lets the field negotiate its own exits, and the run is played
// by exactly two people alone against a clock. Neither is a week four HOH, and
// a weekly draw that turned one up would be narrating a set piece out of place.
// Nothing requests this type except the finale, which forces both by id.
export const BB_COMP_TYPES = Object.freeze(['hoh', 'veto', 'arena', 'tiebreaker', 'return', 'pair', 'final']);
const VALID_TYPES = new Set(BB_COMP_TYPES);
const VALID_STATS = new Set(['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament']);

export const GENERIC_BB_COMPS = Object.freeze([
  {
    id:'generic-memory-booth', name:'Memory Booth', category:'puzzle', types:['hoh','veto','arena','tiebreaker'],
    desc:'Houseguests are called into the booth one at a time and shown a fast run of images, sounds and details from the last few weeks in the house, then answered on it against a clock with nothing to check and nobody to ask. Most of it was in front of them at the time. The highest score wins.',
    stats:{ mental:.48, intuition:.27, strategic:.15, temperament:.10 },
  },
  {
    id:'generic-endurance-wall', name:'Pressure Wall', category:'endurance', types:['hoh','veto'],
    desc:'Houseguests take a position against a wall that tilts, shakes and steadily stops being somewhere a person can hold on to. Every lapse in concentration costs grip, and grip is the only thing being measured. Whoever holds their position longest wins.',
    stats:{ endurance:.46, physical:.19, temperament:.22, boldness:.13 },
  },
  {
    id:'generic-obstacle-course', name:'Backyard Gauntlet', category:'physical', types:['hoh','veto','arena','tiebreaker'],
    desc:'A timed run through the backyard course — over, under and through — with a penalty added for every obstacle taken badly. Going flat out is the fastest way round and also the fastest way to collect penalties, so the winning run is rarely the quickest one. Best adjusted time wins.',
    stats:{ physical:.36, endurance:.29, mental:.14, boldness:.13, intuition:.08 },
  },
  // NOTE: there is deliberately no generic "Before or After" here. The
  // signature library writes that competition in full (bb-sig-before-or-after,
  // eligible for hoh/veto/tiebreaker/return) and the VP dispatches its themed
  // screen off the `variant` tag. A fallback sharing the name meant the same
  // competition could air twice in a season looking like two different things —
  // themed for the veto, a bare one-line board for the HOH. Any new fallback
  // must not reuse a written competition's name.
  {
    id:'generic-balance-stack', name:'Balance Stack', category:'precision', types:['hoh','veto','arena','tiebreaker'],
    desc:'Each houseguest builds a stack of blocks while standing on a platform narrow enough that leaning to place one is its own risk. The stack gets taller, the reach gets longer, and a collapse means starting the tower again from the mat. The tallest stack still standing at the horn wins.',
    stats:{ endurance:.27, physical:.18, mental:.24, temperament:.23, intuition:.08 },
  },
]);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function validateDefinition(comp) {
  if (!comp?.id || !comp?.name || !comp?.category) throw new Error('Big Brother competition definitions require id, name and category.');
  if (!Array.isArray(comp.types) || !comp.types.length || comp.types.some(type => !VALID_TYPES.has(type))) {
    throw new Error(`Big Brother competition ${comp.id} has invalid types.`);
  }
  if (comp.stats) {
    const entries = Object.entries(comp.stats);
    if (!entries.length || entries.some(([stat, weight]) => !VALID_STATS.has(stat) || !Number.isFinite(weight) || weight <= 0)) {
      throw new Error(`Big Brother competition ${comp.id} has an invalid proportional stat profile.`);
    }
  } else if (typeof comp.simulate !== 'function') {
    throw new Error(`Big Brother competition ${comp.id} requires stats or simulate().`);
  }
  return comp;
}

export function validateBBCompetitionLibrary(library = []) {
  const seen = new Set();
  return library.map(validateDefinition).map(comp => {
    if (seen.has(comp.id)) throw new Error(`Duplicate Big Brother competition id: ${comp.id}.`);
    seen.add(comp.id);
    return comp;
  });
}

/**
 * Which competitions a slot will accept.
 *
 * Every slot but one means exactly what it says. `final` is the exception: the
 * two parts of the final Head of Household are a ROLE, not an airing slot, and
 * a competition being written for veto night says nothing about whether three
 * finalists can play it. What actually disqualifies a comp here is its
 * participant contract — an arena game wants two teams and a pair comp wants
 * couples — so those two are the only types that cannot serve.
 *
 * Kept in this file rather than in the finale so the picker, the draw and the
 * runner cannot drift: a pool that offers something the dispatcher then refuses
 * to stage is a dropdown that throws.
 */
const FINAL_SLOT_TYPES = ['hoh', 'veto', 'tiebreaker', 'return', 'final'];
export const servesSlot = (comp, type) => (type === 'final'
  ? FINAL_SLOT_TYPES.some(t => (comp.types || []).includes(t))
  : (comp.types || []).includes(type));

/**
 * What kind of season this is, in competitions.
 *
 * Every comp declares which stats decide it — `{ mental:.48, intuition:.27, … }`
 * — and until now nothing read those at selection time, so which stats mattered
 * in a season was whatever the draw happened to produce. A run could go eight
 * weeks without an endurance comp and the wall-sitters would simply never get a
 * night, with nothing in the setup to say that had happened or to ask for
 * otherwise.
 *
 * `balanced` is not "no bias" — it is an ACTIVE one. It looks at which stats
 * have already decided competitions this season and favours the comps that
 * serve whatever has been idle, so a full season uses the whole cast's range.
 * Leaving it alone would be uniform selection, which is not the same thing: a
 * fair coin lands on one side four times in a row often enough to flatten a
 * season.
 *
 * The leans tilt rather than exclude. `physical` on a mostly-mental library
 * should still run mental comps — a season with one kind of night in it is a
 * worse season, not a more physical one.
 */
export const BB_COMP_MIXES = Object.freeze({
  balanced:  { label: 'Balanced — every stat gets a night', lean: null },
  physical:  { label: 'More physical', lean: ['physical', 'endurance'] },
  mental:    { label: 'More mental', lean: ['mental', 'intuition'] },
  endurance: { label: 'More endurance', lean: ['endurance', 'temperament'] },
  social:    { label: 'More social', lean: ['social', 'strategic'] },
});

/** The season's setting, defaulting to balanced rather than to no rule at all. */
export function bbCompMix(config = seasonConfig) {
  const asked = config?.bbCompMix;
  return BB_COMP_MIXES[asked] ? asked : 'balanced';
}

/**
 * How much of each stat this season's competitions have already asked for.
 *
 * Accumulated from the comp's own weights, so a comp that is 48% mental counts
 * as 0.48 of a mental night rather than one. The alternative — counting only
 * the dominant stat — throws away everything a comp does second, and most of
 * them are decided by two or three.
 */
function statsSpent() {
  const spent = {};
  for (const stat of VALID_STATS) spent[stat] = 0;
  for (const entry of gs.bb?.competitionHistory || []) {
    for (const [stat, weight] of Object.entries(entry.stats || {})) {
      if (stat in spent) spent[stat] += Number(weight) || 0;
    }
  }
  return spent;
}

/**
 * The mix's multiplier for one competition.
 *
 * Bounded on both sides deliberately. A season that has never run an endurance
 * comp should make the next one likely, not certain — the draw is still a draw,
 * and a scheduler that guarantees the gap gets filled produces a rota rather
 * than a season.
 */
function mixWeight(comp, mix) {
  const stats = comp?.stats || {};
  const setting = BB_COMP_MIXES[mix] || BB_COMP_MIXES.balanced;

  if (setting.lean) {
    // How much of this competition is decided by the stats being asked for.
    const share = setting.lean.reduce((n, stat) => n + (Number(stats[stat]) || 0), 0);
    // 0 share is not 0 weight: a mental comp in a physical season still airs.
    return 0.5 + share * 2.2;
  }

  const spent = statsSpent();
  const total = Object.values(spent).reduce((a, b) => a + b, 0);
  // Nothing has run yet — every comp is equally new.
  if (total <= 0) return 1;
  const average = total / Object.keys(spent).length;
  // A comp is worth more the more it serves stats this season has neglected.
  let score = 0;
  for (const [stat, weight] of Object.entries(stats)) {
    const w = Number(weight) || 0;
    if (!w) continue;
    const hunger = average > 0 ? (average - (spent[stat] || 0)) / average : 0;
    score += w * hunger;
  }
  return clamp(1 + score * 1.4, 0.35, 2.6);
}

function selectionWeight(comp, type, ctx) {
  if (!servesSlot(comp, type)) return 0;
  const recent = gs.bb?.recentCompetitionCategories || [];
  const lastIndex = recent.lastIndexOf(comp.category);
  const age = lastIndex < 0 ? 99 : recent.length - 1 - lastIndex;
  const cooldown = age === 0 ? .12 : age === 1 ? .45 : age === 2 ? .72 : 1;
  // A season should not replay a competition while its siblings sit unaired —
  // the category cooldown never noticed IDs, so the same arena game could run
  // three times in one season while four others never appeared. Used comps
  // stay available (a long season outlasts any library) but heavily deferred.
  const used = (gs.bb?.competitionHistory || []).some(h => h.id === comp.id);
  const freshness = used ? 0.15 : 1;
  const custom = typeof comp.weight === 'function' ? Math.max(0, Number(comp.weight(ctx)) || 0) : 1;
  // What kind of season this is. See BB_COMP_MIXES — `balanced` actively
  // favours the stats that have been idle, rather than meaning "no rule".
  const mix = mixWeight(comp, bbCompMix());
  return cooldown * freshness * custom * mix;
}

function chooseCompetition(library, type, ctx, rng, forcedId) {
  const pool = validateBBCompetitionLibrary([...GENERIC_BB_COMPS, ...library]);
  if (forcedId) {
    const forced = pool.find(comp => comp.id === forcedId && servesSlot(comp, type));
    if (!forced) throw new Error(`Forced Big Brother competition ${forcedId} is unavailable for ${type}.`);
    return { comp: forced, weights: [{ id: forced.id, weight: 1, forced: true }] };
  }
  const weights = pool.map(comp => ({ id:comp.id, weight:selectionWeight(comp, type, ctx) })).filter(entry => entry.weight > 0);
  const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
  if (!total) throw new Error(`No eligible Big Brother competition for ${type}.`);
  let roll = rng() * total;
  let picked = weights.at(-1);
  for (const entry of weights) { roll -= entry.weight; if (roll <= 0) { picked = entry; break; } }
  return { comp: pool.find(item => item.id === picked.id), weights };
}

function createCompetitionApi(context) {
  gs.popularity ||= {};
  return Object.freeze({
    addBond(a, b, delta) { if (!a || !b || a === b) return false; addBond(a, b, Number(delta) || 0); return true; },
    popDelta(name, delta) { if (!name) return false; if (seasonConfig.popularityEnabled === false) return false; gs.popularity[name] = (gs.popularity[name] || 0) + (Number(delta) || 0); return true; },
    record(name, type, detail = {}) {
      gs.bb ||= {}; gs.bb.competitionMemories ||= {}; gs.bb.competitionMemories[name] ||= [];
      gs.bb.competitionMemories[name].push({ type, competitionId:context.competitionId, week:context.week?.num || 0, detail });
      return true;
    },
  });
}

function genericSimulation(comp, participants, context, rng) {
  const breakdown = {};
  const scored = participants.map(name => {
    const stats = pStats(name);
    const statComponents = Object.fromEntries(Object.entries(comp.stats).map(([stat, weight]) => [stat, stats[stat] * weight]));
    const statTotal = Object.values(statComponents).reduce((sum, value) => sum + value, 0);
    const randomRoll = (rng() * 4) - 2;
    // Both competitions can be thrown, for different reasons: the HOH to stay
    // small, the veto to stay out of a decision nobody wants to hold.
    const throwRead = context.type === 'hoh'
      ? shouldThrowHoh(name, context.house || participants, context)
      : context.type === 'veto'
        ? { ...shouldThrowVeto(name, context), enemies: 0, safety: 0, slopRisk: 0 }
        : { throwChance:0, enemies:0, safety:0, slopRisk:0 };
    const threw = context.allowThrowing !== false && rng() < throwRead.throwChance;
    const throwPenalty = threw ? 4.5 + rng() * 3 : 0;
    // A week of cold showers and slop is a real disadvantage, not a costume.
    // Big enough to cost a close competition, small enough that a have-not can
    // still win one — which is the whole story when it happens.
    const haveNot = (context.haveNots || []).includes(name);
    const haveNotPenalty = haveNot ? 1.4 + rng() * 1.6 : 0;
    // People in danger play harder — the same model the custom competitions use.
    const gun = gunningFor(name, context, rng);
    const finalScore = statTotal + randomRoll - throwPenalty - haveNotPenalty + gun.bonus;
    breakdown[name] = { statComponents, statTotal, randomRoll, throwIntentChance:throwRead.throwChance, threw, throwPenalty, throwSlopRisk:throwRead.slopRisk || 0, haveNot, haveNotPenalty, gunningFor:gun.reason, gunningBonus:gun.bonus, finalScore };
    return { name, score:finalScore, threw };
  }).sort((a,b) => b.score - a.score);
  return {
    winner:scored[0].name, placements:scored.map(entry => entry.name),
    scores:Object.fromEntries(scored.map(entry => [entry.name, entry.score])),
    beats:[{ type:'generic-result', text:`${scored[0].name} wins ${comp.name}.`, players:[scored[0].name], badgeText:context.type.toUpperCase(), badgeClass:'challenge' }],
    events:[], text:`${scored[0].name} wins ${comp.name}.`, breakdown,
  };
}

function normalizeResult(comp, raw, participants, context, selection, source) {
  const warnings = [];
  if (!raw || typeof raw !== 'object') throw new Error(`Big Brother competition ${comp.id} returned no result.`);
  const placements = Array.isArray(raw.placements) ? [...raw.placements] : [];
  if (placements.length !== participants.length || new Set(placements).size !== participants.length || placements.some(name => !participants.includes(name))) {
    throw new Error(`Big Brother competition ${comp.id} returned invalid placements.`);
  }
  let winner = raw.winner || placements[0];
  if (winner !== placements[0] || !participants.includes(winner)) throw new Error(`Big Brother competition ${comp.id} returned an invalid winner.`);
  const scores = raw.scores || {};
  if (participants.some(name => !Number.isFinite(Number(scores[name])))) throw new Error(`Big Brother competition ${comp.id} requires a numeric score for every participant.`);

  // ── somebody got to the yard first ──
  //
  // The Saboteur's rig mission used to be pure narration: the screen said a
  // marker had been moved four inches and the result of the competition was
  // exactly what it would have been anyway. A sabotage nobody can see in the
  // standings is a caption, not a mechanic.
  //
  // Applied HERE because it is the one place every competition passes through.
  // The generic scorer and sixty hand-written ones all arrive with placements
  // and scores, so a penalty applied to the finished board works for all of
  // them without each having to know the twist exists. It is scaled off the
  // spread of the board rather than being a flat number, because competitions
  // score on wildly different ranges — a fifth of the field's spread is a real
  // handicap whether the comp is marked out of ten or out of four hundred.
  let sabotage = null;
  const mark = context?.sabotaged;
  if (mark && participants.includes(mark)) {
    const values = participants.map(name => Number(scores[name]));
    const spread = Math.max(...values) - Math.min(...values);
    const penalty = (spread > 0 ? spread : 1) * 0.38;
    const before = [...placements];
    const adjusted = Object.fromEntries(participants.map(name =>
      [name, Number(scores[name]) - (name === mark ? penalty : 0)]));
    const after = [...participants].sort((a, b) => adjusted[b] - adjusted[a]);
    sabotage = {
      name: mark, penalty: Math.round(penalty * 100) / 100,
      placedBefore: before.indexOf(mark) + 1,
      placedAfter: after.indexOf(mark) + 1,
      // The number that makes it a story rather than a stat: did moving that
      // marker actually take the competition off them?
      costTheWin: before[0] === mark && after[0] !== mark,
      wonInstead: before[0] === mark && after[0] !== mark ? after[0] : null,
    };
    placements.length = 0;
    placements.push(...after);
    for (const name of participants) scores[name] = adjusted[name];
    winner = placements[0];
  }
  // ── the Debug tab's two levers, guaranteed ──
  //
  // The Competitions panel explains a result with aptitude and luck. A custom
  // competition that reported neither rendered blank rows, and whether the
  // lever test passed came down to which competition the week drew. Aptitude is
  // computable from the stat profile for anybody, and luck is merged from
  // whatever the competition banked, so this holds for every competition rather
  // than the ones that remembered.
  const scoreRows = raw.breakdown || raw.debug?.scoreBreakdown || null;
  if (scoreRows && comp.stats) {
    for (const name of participants) {
      const row = scoreRows[name];
      if (!row || typeof row !== 'object') continue;
      if (!Number.isFinite(row.statTotal ?? row.base)) {
        const stats = pStats(name);
        row.base = Math.round(Object.entries(comp.stats)
          .reduce((sum, [stat, weight]) => sum + (stats[stat] || 0) * weight, 0) * 100) / 100;
      }
      if (!Number.isFinite(row.randomRoll ?? row.roll) && Number.isFinite(raw.luck?.[name])) {
        row.roll = Math.round(raw.luck[name] * 100) / 100;
      }
    }
  }

  const beats = raw.beats || [];
  const events = raw.events || [];
  for (const event of [...beats, ...events]) {
    if (!event?.text || !Array.isArray(event.players) || !event.badgeText || !event.badgeClass) {
      throw new Error(`Big Brother competition ${comp.id} returned an unrenderable beat/event.`);
    }
  }
  if (!beats.length) warnings.push('competition produced no narrative beats');
  if (!raw.text) warnings.push('competition produced no plain-text narration');
  const result = {
    id:comp.id, name:comp.name, type:context.type, category:comp.category,
    // What the competition IS. Every entry in the library has written one and
    // nothing downstream could reach it, so the results screen described the
    // category instead of the thing fourteen people just played.
    desc:comp.desc || '', stats:comp.stats ? { ...comp.stats } : null,
    variant:raw.variant || null, participants:[...participants], excluded:[...(context.excluded || [])],
    winner, placements, scores:Object.fromEntries(participants.map(name => [name, Number(scores[name])])),
    // Null on every ordinary competition; set only when a saboteur got to the
    // yard first, and read by js/bb/saboteur.js to say what it actually cost.
    sabotage,
    beats, events, text:raw.text || beats.map(beat => beat.text).join(' '),
    // A pair competition's real result, kept intact. The week used to recover
    // it by averaging the four individual scores, which cannot represent a pair
    // that lost because of one of its halves — the whole point of the format.
    pairScores:raw.pairScores || null, pairWinner:raw.pairWinner || null,
    // A competition's own structured record, carried verbatim for the screens.
    // Beats are prose and breakdown rows are debug numbers, so a competition
    // whose result IS data — the jury quiz's statements, the options offered
    // and which ending was true — had nowhere to put it and was silently
    // losing it here.
    detail:raw.detail || null,
    debug:{
      competitionId:comp.id, source, type:context.type, variant:raw.variant || null,
      participants:[...participants], excluded:[...(context.excluded || [])],
      formula:comp.stats ? { ...comp.stats } : (raw.debug?.formula || null),
      scoreBreakdown:raw.breakdown || raw.debug?.scoreBreakdown || {},
      selectionWeights:selection.weights, rngSeed:context.seed ?? null,
      winnerMargin:placements.length > 1 ? Number(scores[placements[0]]) - Number(scores[placements[1]]) : null,
      warnings:[...warnings, ...(raw.debug?.warnings || [])],
    },
  };
  return result;
}

export function runBBCompetition(options = {}) {
  const type = options.type;
  if (!VALID_TYPES.has(type)) throw new Error(`Unknown Big Brother competition type: ${type}.`);
  const participants = [...new Set(options.participants || [])];
  if (participants.length < 2) throw new Error(`Big Brother ${type} competition requires at least two unique participants.`);
  const rng = options.rng || Math.random;
  const context = {
    type, house:[...(options.house || participants)], excluded:[...(options.excluded || [])],
    week:options.week || null, seed:options.seed, allowThrowing:options.allowThrowing,
    nominees:[...(options.nominees || [])], hoh:options.hoh || null,
    // Who is on slop this week. Custom competitions can read it; the generic
    // scorer applies it directly.
    haveNots:[...(options.haveNots || [])],
    // One name, handicapped on the finished board by a saboteur who got there
    // first. See normalizeResult.
    sabotaged: options.sabotaged || null,
    // Who is playing WITH whom. Only the pair slot fills this, and a pair
    // competition handed no pairing declines to run rather than inventing
    // partners for people the week never put together.
    pairs:(options.pairs || []).map(pair => ({ owner:pair.owner, members:[...(pair.members || [])] })),
    // Who is on the jury bench. Only finale night fills it, and only the jury
    // quiz reads it — a competition that quotes seven people has to be told
    // which seven rather than guessing from whoever is not still playing.
    jury:[...(options.jury || [])],
  };
  const selection = chooseCompetition(options.library || [], type, context, rng, options.forcedId);
  const comp = selection.comp;
  context.competitionId = comp.id;
  const source = typeof comp.simulate === 'function' ? 'custom' : 'generic';
  const raw = source === 'custom'
    ? comp.simulate(participants, context, createCompetitionApi(context), rng)
    : genericSimulation(comp, participants, context, rng);
  const result = normalizeResult(comp, raw, participants, context, selection, source);
  gs.bb ||= {};
  gs.bb.recentCompetitionCategories = [...(gs.bb.recentCompetitionCategories || []), comp.category].slice(-3);
  gs.bb.competitionHistory ||= [];
  // `stats` rides along because the balanced mix reads what a season has
  // already asked of the cast, and the history is the only record of it. Copied
  // rather than referenced: the library object is shared across every season in
  // the process.
  gs.bb.competitionHistory.push({ week:context.week?.num || 0, type, id:comp.id,
    winner:result.winner, category:comp.category, stats:{ ...(comp.stats || {}) } });
  return result;
}
