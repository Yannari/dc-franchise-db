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
  'group', 'plan', 'boot', 'wrote', 'fallen', 'more', 'betrayer', 'holder', 'wins', 'other',
  // who a and b are, beyond how they talk: an AUTHORED age band ('kid' under 13, 'teen', 'twenties',
  // 'thirties', 'older'; absent when nobody set an age), who is older, the archetype,
  // and what a is notably good or bad at (stat >= 7, temperament <= 3 'hot' / >= 8 'calm').
  // Narrative text selection only, never gameplay.
  'age', 'ageB', 'gap', 'arch', 'archB', 'strong', 'brainy', 'tough', 'bold', 'charm', 'sly', 'loyal', 'sharp', 'hot', 'calm',
  // authored facts a line may say: a's hometown and job ({home}, {job})
  'home', 'job',
];

// Names a scene MAY carry: a line saying one must ask for it (when: { slot: true }).
// The context reasons, plus the optional names an event decides (an alliance's
// name is only there when the alliance has one; a plan may have had no target).
export const CONTEXT_SLOTS = ['rival', 'friend', 'threat', 'weak', 'lastBoot', 'group', 'plan', 'boot', 'wrote', 'fallen', 'more', 'betrayer', 'holder', 'wins', 'other', 'home', 'job'];

/** The authored age, from `age` or `birthdate` (never invented). */
export function ageOf(name) {
  const p = players.find(x => x.name === name);
  if (!p) return null;
  if (Number.isFinite(p.age)) return p.age;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(p.birthdate || '');
  if (!m) return null;
  const now = new Date(), y = now.getFullYear() - +m[1] - ((now.getMonth() + 1 < +m[2] || (now.getMonth() + 1 === +m[2] && now.getDate() < +m[3])) ? 1 : 0);
  return y > 0 && y < 110 ? y : null;
}
const ageBand = n => { const a = ageOf(n); return a == null ? null : a < 13 ? 'kid' : a < 20 ? 'teen' : a < 30 ? 'twenties' : a < 40 ? 'thirties' : 'older'; };

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
    const band = ageBand(a); if (band) f.age = band;
    f.arch = archOf(a) || null;
    let s = {}; try { s = pStats(a) || {}; } catch { s = {}; }
    f.strong = (s.physical ?? 5) >= 7; f.brainy = (s.mental ?? 5) >= 7; f.tough = (s.endurance ?? 5) >= 7; f.bold = (s.boldness ?? 5) >= 7;
    f.charm = (s.social ?? 5) >= 7; f.sly = (s.strategic ?? 5) >= 7; f.loyal = (s.loyalty ?? 5) >= 7; f.sharp = (s.intuition ?? 5) >= 7;
    f.hot = (s.temperament ?? 5) <= 3; f.calm = (s.temperament ?? 5) >= 8;
  }
  if (a && b) {
    const bond = getBond(a, b);
    f.band = bond <= -3 ? 'enemies' : bond < 0 ? 'cold' : bond < 3 ? 'neutral' : 'friends';
    f.registerB = registerOf(b);
    f.alliedB = inAny(b);
    f.alliance = sharesAlliance(a, b);
    const bandB = ageBand(b); if (bandB) f.ageB = bandB;
    f.archB = archOf(b) || null;
    const ya = ageOf(a), yb = ageOf(b);
    if (ya != null && yb != null) f.gap = ya - yb >= 12 ? 'older' : yb - ya >= 12 ? 'younger' : 'same';
    f.showmance = inShowmance(a, b);
    try { f.kin = (REL_KINSHIP[kinshipBetween(a, b)]?.group || '').toLowerCase() || 'none'; } catch { f.kin = 'none'; }
  }
  const d = scene.data || {};
  for (const k of ['ending', 'result', 'intent', 'reason', 'again', 'size']) if (d[k] !== undefined && d[k] !== null) f[k] = d[k];
  for (const k of CONTEXT_SLOTS) f[k] = !!d[k];
  return f;
}
