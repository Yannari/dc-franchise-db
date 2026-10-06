// ══════════════════════════════════════════════════════════════════════
// td/script/facts.js — what a line may know about its scene
// ══════════════════════════════════════════════════════════════════════
//
// A pool entry's `when` filters on these facts and nothing else; a test
// refuses any other key (spec 2026-10-06 §5). Facts are read from the camp as
// it stands at the scene — never a truth the speaker has not seen.
// Thresholds here are narrative text selection only, never gameplay.
import { gs, players, kinshipBetween, REL_KINSHIP } from '../../core.js';
import { getBond } from '../../bonds.js';
import { pStats } from '../../players.js';

const epOf = ctx => ctx.ep || (gs.episode || 0) + 1;

export const TD_FACT_KEYS = [
  // what was decided (from the scene's data)
  'ending', 'result', 'intent', 'reason', 'again', 'size',
  // the relationship between a and b; whether each is in any active alliance at all
  'band', 'alliance', 'showmance', 'kin', 'allied', 'alliedB',
  // how a and b talk
  'register', 'registerB', 'nice', 'villain',
  // where in the season and the episode
  'early', 'late', 'merged', 'phase', 'tribal', 'immune',
  // the scene names a target ({target}) who is not in it
  'known',
  // where the scene is: a line that stages the dock airs only on the dock
  'spot',
  // a third part is present
  'third',
  // the real reasons a line may give (td/script/context.js): true when the
  // scene's data names one, and only then may a line say {rival}, {threat}...
  'rival', 'friend', 'threat', 'weak', 'lastBoot',
  // optional names an event decides
  'group', 'plan', 'boot', 'wrote', 'fallen', 'more',
];

// Names a scene MAY carry: a line saying one must ask for it (when: { slot: true }).
// The context reasons, plus the optional names an event decides (an alliance's
// name is only there when the alliance has one; a plan may have had no target).
export const CONTEXT_SLOTS = ['rival', 'friend', 'threat', 'weak', 'lastBoot', 'group', 'plan', 'boot', 'wrote', 'fallen', 'more'];

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN = new Set(['villain', 'mastermind', 'schemer']);
const archOf = n => players.find(p => p.name === n)?.archetype;

/**
 * How somebody talks, read from who they are: schemer, fiery, shy, sweet,
 * competitor, cool or plain. The same reading as Big Brother's registerOf.
 */
export function registerOf(name) {
  const arch = archOf(name);
  let s = {};
  try { s = pStats(name) || {}; } catch { s = {}; }
  const t = s.temperament ?? 5, so = s.social ?? 5, st = s.strategic ?? 5;
  if (VILLAIN.has(arch)) return 'schemer';
  if (['hothead', 'chaos-agent'].includes(arch) || t <= 3) return 'fiery';
  if (['goat', 'underdog', 'floater'].includes(arch) || so <= 3) return 'shy';
  if (NICE.has(arch)) return 'sweet';
  if (arch === 'challenge-beast') return 'competitor';
  if (arch === 'perceptive-player' || (st >= 7 && t >= 6)) return 'cool';
  return 'plain';
}

const sharesAlliance = (a, b) => (gs.namedAlliances || []).some(al => al.active !== false
  && (al.members || []).includes(a) && (al.members || []).includes(b));
const inShowmance = (a, b) => (gs.showmances || []).some(s => s.phase !== 'broken-up'
  && (s.players || []).includes(a) && (s.players || []).includes(b));

/**
 * The facts for a scene. `ctx`: { ep (number), phase ('pre'|'post'|'tribal'),
 * tribal (this camp goes to Tribal tonight), immune (names) }.
 */
export function factsFor(scene, ctx = {}) {
  const { a, b, c } = scene.who || {};
  const epNum = epOf(ctx);
  const f = {
    early: epNum <= 2,
    late: (gs.activePlayers?.length || 0) > 0 && gs.activePlayers.length <= 6,
    merged: !!gs.isMerged,
    phase: ctx.phase || null,
    tribal: ctx.tribal ?? null,
    third: !!c,
    spot: scene.spot?.id || null,
    known: !!scene.data?.target && !Object.values(scene.who || {}).includes(scene.data.target),
  };
  const inAny = n => (gs.namedAlliances || []).some(al => al.active !== false && (al.members || []).includes(n));
  if (a) {
    f.allied = inAny(a);
    f.register = registerOf(a);
    f.nice = NICE.has(archOf(a));
    f.villain = VILLAIN.has(archOf(a));
    f.immune = (ctx.immune || []).includes(a);
  }
  if (a && b) {
    const bond = getBond(a, b);
    f.band = bond <= -3 ? 'enemies' : bond < 0 ? 'cold' : bond < 3 ? 'neutral' : 'friends';
    f.registerB = registerOf(b);
    f.alliedB = inAny(b);
    f.alliance = sharesAlliance(a, b);
    f.showmance = inShowmance(a, b);
    try { f.kin = (REL_KINSHIP[kinshipBetween(a, b)]?.group || '').toLowerCase() || 'none'; } catch { f.kin = 'none'; }
  }
  const d = scene.data || {};
  for (const k of ['ending', 'result', 'intent', 'reason', 'again', 'size']) if (d[k] !== undefined && d[k] !== null) f[k] = d[k];
  for (const k of CONTEXT_SLOTS) f[k] = !!d[k];
  return f;
}
