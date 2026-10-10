// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/voiced.js — a line in the speaker's own way, for the twist scenes written in the viewer
// ══════════════════════════════════════════════════════════════════════
// Every line comes as { sharp, dry, loud, soft, odd, any } (td/story/voice-family.js). The speaker says
// their own family's line; somebody whose voice has no family talks the way their archetype does; the
// general line only when the family has none for that slot. A line already said on this screen is not
// said again while there's another. Deterministic: the same episode always plays the same way.
import { familyOf } from '../td/story/voice-family.js';
import { pronouns } from '../players.js';
import { players } from '../core.js';

const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const BY_ARCH = { villain: 'sharp', schemer: 'sharp', mastermind: 'sharp', hothead: 'loud', 'challenge-beast': 'loud', 'chaos-agent': 'loud',
  hero: 'soft', 'loyal-soldier': 'soft', 'social-butterfly': 'soft', showmancer: 'soft', underdog: 'soft', floater: 'dry', 'perceptive-player': 'dry', goat: 'odd', wildcard: 'odd' };
export const archOf = n => (players || []).find?.(p => p.name === n)?.archetype || (globalThis.FRANCHISE_ROSTER || []).find?.(p => p?.name === n)?.archetype || null;
export function famOf(n) {
  let f = 'plain';
  try { f = familyOf(n) || 'plain'; } catch { /* no voice */ }
  const arch = archOf(n);
  // a villain's charm is still a villain's: never the soft, scared lines (Alejandro reads "charming")
  if (f === 'soft' && ['villain', 'schemer', 'mastermind'].includes(arch)) return 'sharp';
  return f !== 'plain' ? f : (BY_ARCH[arch] || 'plain');
}
/** Pronoun forms plus the verb agreements a line needs ({is, has, was, s: "smile|s"}). */
export function P(n) {
  const p = pronouns(n), they = p.sub === 'they';
  return { ...p, is: they ? 'are' : 'is', has: they ? 'have' : 'has', was: they ? 'were' : 'was', s: they ? '' : 's', does: they ? 'do' : 'does' };
}
/** A voicer for one screen: V(name, { family: [lines] }, tag). */
export function voicer(key) {
  const used = new Set();
  return (n, o, tag) => {
    const f = famOf(n);
    const opts = (o[f] && o[f].length) ? o[f] : (o.any || Object.values(o)[0] || []);
    const fresh = opts.filter(t => !used.has(t));
    const list = fresh.length ? fresh : opts;
    const t = list[hash(`${key}|${tag}|${n}`) % list.length];
    used.add(t);
    return t;
  };
}
export const listOf = a => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
