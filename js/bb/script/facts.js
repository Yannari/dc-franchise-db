// ══════════════════════════════════════════════════════════════════════
// bb/script/facts.js — what a line may know about its scene
// ══════════════════════════════════════════════════════════════════════
//
// A pool entry's `when` filters on these facts and nothing else; a test
// refuses any other key (spec §4.3). New keys arrive with the pool that needs
// them. Facts are read from the record and the house as it is at the scene —
// never the truth a speaker has not seen.
import { gs } from '../../core.js';
import { getBond } from '../../bonds.js';
import { players } from '../../core.js';

export const BB_FACT_KEYS = ['ending', 'result', 'intent', 'reason', 'act', 'early', 'late', 'band',
  'showmance', 'alliance', 'hohA', 'hohB', 'nomA', 'nomB', 'havenot', 'third', 'nice', 'villain', 'again'];

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN = new Set(['villain', 'mastermind', 'schemer']);
const archOf = n => players.find(p => p.name === n)?.archetype;

function sharesAlliance(a, b) {
  return (gs.namedAlliances || []).some(al => al.active !== false && (al.members || []).includes(a) && (al.members || []).includes(b));
}
function inShowmance(a, b) {
  return (gs.showmances || []).some(s => s.phase !== 'broken-up' && (s.players || []).includes(a) && (s.players || []).includes(b));
}

/** The facts for a scene in its act. `ctx` is the house-event context (act, week, hoh, nominees). */
export function factsFor(scene, ctx = {}) {
  const { a, b, c } = scene.who || {};
  const week = ctx.week?.num || 0;
  const house = gs.activePlayers?.length || 0;
  const f = {
    act: ctx.act || null,
    early: week <= 2,
    late: house > 0 && house <= 6,
    third: !!c,
  };
  if (a) {
    f.hohA = a === ctx.hoh || (ctx.hohs || []).includes(a);
    f.nomA = (ctx.nominees || []).includes(a);
    f.havenot = (ctx.week?.haveNots || gs.bb?.haveNots || []).includes?.(a) || false;
    f.nice = NICE.has(archOf(a));
    f.villain = VILLAIN.has(archOf(a));
  }
  if (a && b) {
    const bond = getBond(a, b);
    f.band = bond <= -3 ? 'enemies' : bond < 0 ? 'cold' : bond < 3 ? 'neutral' : 'friends';
    f.hohB = b === ctx.hoh || (ctx.hohs || []).includes(b);
    f.nomB = (ctx.nominees || []).includes(b);
    f.alliance = sharesAlliance(a, b);
    f.showmance = inShowmance(a, b);
  }
  const d = scene.data || {};
  for (const k of ['ending', 'result', 'intent', 'reason', 'again']) if (d[k] !== undefined && d[k] !== null) f[k] = d[k];
  return f;
}
