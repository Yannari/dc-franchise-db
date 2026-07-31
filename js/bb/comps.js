// Big Brother competition dispatcher and contract.
// Production competition modules live in js/bb-comps/ and are passed in as a
// library. This file owns selection, the generic fallback, validation and the
// debug envelope shared by both paths.
import { gs } from '../core.js';
import { pStats } from '../players.js';
import { addBond } from '../bonds.js';
import { shouldThrowHoh } from './strategy.js';

export const BB_COMP_TYPES = Object.freeze(['hoh', 'veto', 'arena', 'tiebreaker']);
const VALID_TYPES = new Set(BB_COMP_TYPES);
const VALID_STATS = new Set(['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament']);

export const GENERIC_BB_COMPS = Object.freeze([
  {
    id:'generic-memory-booth', name:'Memory Booth', category:'puzzle', types:['hoh','veto','arena','tiebreaker'],
    desc:'Houseguests study a sequence of images, sounds and details before answering under pressure.',
    stats:{ mental:.48, intuition:.27, strategic:.15, temperament:.10 },
  },
  {
    id:'generic-endurance-wall', name:'Pressure Wall', category:'endurance', types:['hoh','veto'],
    desc:'Houseguests hold position as the wall tilts, shakes and punishes every lapse in focus.',
    stats:{ endurance:.46, physical:.19, temperament:.22, boldness:.13 },
  },
  {
    id:'generic-obstacle-course', name:'Backyard Gauntlet', category:'physical', types:['hoh','veto','arena','tiebreaker'],
    desc:'A timed obstacle course tests speed, stamina, nerve and enough focus to avoid costly mistakes.',
    stats:{ physical:.36, endurance:.29, mental:.14, boldness:.13, intuition:.08 },
  },
  {
    id:'generic-before-after', name:'Before or After', category:'quiz', types:['hoh','veto','tiebreaker'],
    desc:'Houseguests reconstruct the season timeline one decision at a time.',
    stats:{ mental:.50, intuition:.28, strategic:.14, temperament:.08 },
  },
  {
    id:'generic-balance-stack', name:'Balance Stack', category:'precision', types:['hoh','veto','arena','tiebreaker'],
    desc:'Houseguests build an unstable stack while balancing on a narrow platform.',
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

function selectionWeight(comp, type, ctx) {
  if (!comp.types.includes(type)) return 0;
  const recent = gs.bb?.recentCompetitionCategories || [];
  const lastIndex = recent.lastIndexOf(comp.category);
  const age = lastIndex < 0 ? 99 : recent.length - 1 - lastIndex;
  const cooldown = age === 0 ? .12 : age === 1 ? .45 : age === 2 ? .72 : 1;
  const custom = typeof comp.weight === 'function' ? Math.max(0, Number(comp.weight(ctx)) || 0) : 1;
  return cooldown * custom;
}

function chooseCompetition(library, type, ctx, rng, forcedId) {
  const pool = validateBBCompetitionLibrary([...GENERIC_BB_COMPS, ...library]);
  if (forcedId) {
    const forced = pool.find(comp => comp.id === forcedId && comp.types.includes(type));
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
    popDelta(name, delta) { if (!name) return false; gs.popularity[name] = (gs.popularity[name] || 0) + (Number(delta) || 0); return true; },
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
    const throwRead = context.type === 'hoh' ? shouldThrowHoh(name, context.house || participants) : { throwChance:0, enemies:0, safety:0 };
    const threw = context.allowThrowing !== false && rng() < throwRead.throwChance;
    const throwPenalty = threw ? 4.5 + rng() * 3 : 0;
    // A week of cold showers and slop is a real disadvantage, not a costume.
    // Big enough to cost a close competition, small enough that a have-not can
    // still win one — which is the whole story when it happens.
    const haveNot = (context.haveNots || []).includes(name);
    const haveNotPenalty = haveNot ? 1.4 + rng() * 1.6 : 0;
    const finalScore = statTotal + randomRoll - throwPenalty - haveNotPenalty;
    breakdown[name] = { statComponents, statTotal, randomRoll, throwIntentChance:throwRead.throwChance, threw, throwPenalty, haveNot, haveNotPenalty, finalScore };
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
  const winner = raw.winner || placements[0];
  if (winner !== placements[0] || !participants.includes(winner)) throw new Error(`Big Brother competition ${comp.id} returned an invalid winner.`);
  const scores = raw.scores || {};
  if (participants.some(name => !Number.isFinite(Number(scores[name])))) throw new Error(`Big Brother competition ${comp.id} requires a numeric score for every participant.`);
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
    variant:raw.variant || null, participants:[...participants], excluded:[...(context.excluded || [])],
    winner, placements, scores:Object.fromEntries(participants.map(name => [name, Number(scores[name])])),
    beats, events, text:raw.text || beats.map(beat => beat.text).join(' '),
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
  gs.bb.competitionHistory.push({ week:context.week?.num || 0, type, id:comp.id, winner:result.winner, category:comp.category });
  return result;
}
