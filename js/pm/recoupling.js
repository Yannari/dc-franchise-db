// ══════════════════════════════════════════════════════════════════════
// pm/recoupling.js — "Islanders, it's time to recouple"
// ══════════════════════════════════════════════════════════════════════
//
// The picking group chooses one at a time; the picked has no say — except
// when a second picker wants somebody already taken, and then THAT islander
// decides (spec §9.1). Every chooser reads THEIR OWN feelings and what they
// BELIEVE the other feels (spec §6.3, §7): never the other person's truth,
// and never approval or fame.
import { attr } from './chemistry.js';
import { romance, friendship, believed } from './feelings.js';
import { partnerOf } from './events.js';

// How much each intent weighs connection, attraction and safety.
export const INTENT_WEIGHTS = {
  love: { conn: 1.0, attr: 0.4, safe: 0.3 },
  'settle-down': { conn: 1.1, attr: 0.3, safe: 0.3 },
  'first-love': { conn: 0.9, attr: 0.6, safe: 0.2 },
  'fresh-start': { conn: 0.9, attr: 0.4, safe: 0.4 },
  fun: { conn: 0.3, attr: 1.0, safe: 0.2 },
  stir: { conn: 0.3, attr: 0.9, safe: 0.3 },
  fame: { conn: 0.5, attr: 0.6, safe: 0.5 },
  win: { conn: 0.5, attr: 0.3, safe: 1.0 },
  money: { conn: 0.4, attr: 0.3, safe: 0.9 },
};

function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** How much `p` wants `c`, proportional in every term. */
function desire(state, p, c, { rng, taken }) {
  const prof = state.profiles[p], s = prof.stats;
  const w = INTENT_WEIGHTS[prof.intent] || INTENT_WEIGHTS.love;
  // My feelings for you, and what I BELIEVE you feel for me.
  const conn = (romance(p, c) + Math.max(0, friendship(p, c)) * 0.5) / 10;
  const att = (attr(state, p, c) ?? 0) / 10;
  const safety = (believed(state, p, c) / 10) * (s.strategic / 10);
  const stay = partnerOf(state, p) === c ? 0.25 + 0.5 * s.loyalty / 10 : 0;
  const stealCost = taken.has(c) ? 0.4 - 0.3 * s.boldness / 10 : 0;
  const archConn = prof.archetype === 'showmancer' ? 1.15 : 1;
  const archSafe = prof.archetype === 'villain' || prof.archetype === 'schemer' ? 1.3 : 1;
  return w.conn * conn * archConn + w.attr * att + w.safe * safety * archSafe
    + stay - stealCost + (rng() - 0.5) * 0.2;
}

/**
 * Which of those terms carried the pick — so the speech at the fire pit says
 * the real reason (a strategy pick never claims a spark). Reads the same
 * inputs as desire(), draws no dice.
 */
export function pickReason(state, p, c) {
  const prof = state.profiles[p], s = prof.stats;
  const w = INTENT_WEIGHTS[prof.intent] || INTENT_WEIGHTS.love;
  const parts = {
    connection: w.conn * (romance(p, c) + Math.max(0, friendship(p, c)) * 0.5) / 10,
    attraction: w.attr * (attr(state, p, c) ?? 0) / 10,
    safety: w.safe * (believed(state, p, c) / 10) * (s.strategic / 10),
    loyalty: partnerOf(state, p) === c ? 0.25 + 0.5 * s.loyalty / 10 : 0,
  };
  return Object.entries(parts).sort((x, y) => y[1] - x[1])[0][0];
}

export function runRecoupling(state, { rng, pickerGender }) {
  const room = state.villa.filter(n => !(state.split && state.casa.includes(n)));
  const pickers = shuffle(rng, room.filter(n => state.profiles[n].gender === pickerGender));
  const candidates = room.filter(n => !pickers.includes(n));
  const taken = new Map();            // candidate -> picker
  const picks = [];
  const ctx = { rng, taken };
  for (const p of pickers) {
    let options = candidates.filter(c => attr(state, p, c) != null);
    for (let attempt = 0; attempt < 2 && options.length; attempt++) {
      const best = options.map(c => [c, desire(state, p, c, ctx)]).sort((x, y) => y[1] - x[1])[0][0];
      const holder = taken.get(best);
      if (holder) {
        // The picked islander decides between the two.
        const keep = desire(state, best, holder, ctx) >= desire(state, best, p, ctx);
        if (keep) { options = options.filter(c => c !== best); continue; }
        picks.push({ picker: p, picked: best, stole: holder, reason: pickReason(state, p, best) });
      } else {
        picks.push({ picker: p, picked: best, stole: null, reason: pickReason(state, p, best) });
      }
      taken.set(best, p);
      break;
    }
  }
  const couples = [...taken].map(([c, p]) => [p, c]);
  const coupled = new Set(couples.flat());
  return {
    picks,
    couples,
    single: room.filter(n => !coupled.has(n)),
    ballots: picks.map(x => ({ voter: x.picker, target: x.picked, channel: 'recoupling' })),
  };
}
