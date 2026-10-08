// ══════════════════════════════════════════════════════════════════════
// td/story/write.js — one storyline step becomes one whole scene
// ══════════════════════════════════════════════════════════════════════
//
// Spec 2026-10-07 §2.2. A scene is written WHOLE: one pool entry is the entire
// conversation (an activity, the reason it happens now, the pressure, a turn,
// and a button), in the rhythm of the shows' camp scenes. Pools live in
// js/td/story/lines/*.js keyed '<pool>.<outcome>' falling back to '<pool>.any'.
//
// An entry: { id, when?, turns: [{ by: 'a'|'b'|'c'|'d', say | conf } | { beat }] }.
// `when` filters on facts (STORY_FACT_KEYS, checked by tests/td-story.test.js).
// The words draw from their own stream (stableRng), never the engine's dice.
import { gs } from '../../core.js';
import { pickEntry, newLedger } from '../../script/pick.js';
import { stableRng } from '../../script/rng.js';
import { fill, transcript, salt } from '../script/write.js';
import { STORY_POOLS } from './lines/index.js';
import { hasPlace, placeOf, placeById, kindOf } from './places.js';

const OUTDOOR = /\b(fire( pit)?|firewood|campfire|fishing|fish|lake|water's edge|the water|sand|beach|dock|log|shore|tent|shelter|woods|forest|stones?|pebbles?)\b/i;
const ledger = () => ((gs.tdStory ||= {}).ledger ||= newLedger());

export const hasStoryPool = pool => !!(STORY_POOLS[`${pool}.any`]?.length || Object.keys(STORY_POOLS).some(k => k.startsWith(pool + '.')));

const keysFor = (pool, outcome) => [`${pool}.${outcome || 'any'}`, `${pool}.any`].filter((k, i, a) => a.indexOf(k) === i && STORY_POOLS[k]?.length);

/**
 * Write one scene. `who` names the parts ({a, b, c, d}); `data` the names a line may say
 * ({lastBoot}, {target}, {alliance}...); `facts` what a line's `when` may ask.
 * Returns { lines, text, lineId } or null when no pool fits.
 */
export function writeStory(pool, outcome, who, data, facts, ctx) {
  const keys = keysFor(pool, outcome);
  if (!keys.length) return null;
  const rng = stableRng('td-story', salt(), ctx.ep, ctx.camp || '', ctx.phase || '', pool, who.a || '', who.b || '', ctx.n || 0);
  const speakers = Object.values(who).filter(Boolean);
  const pairKey = [who.a, who.b].filter(Boolean).sort().join('|');
  // A scene staged somewhere the season does not have is out: no campfire or fishing on the
  // World Tour jet, no coconuts anywhere but the survival island.
  const placeOk = e => {
    const text = (e.turns || []).map(t => t.beat || t.say || t.conf || '').join(' ');
    if (facts.venue === 'world-tour' && OUTDOOR.test(text)) return false;
    if (facts.venue !== 'survival-island' && /coconut/i.test(text)) return false;
    // the kind of place the scene needs (places.js): the venue must have one
    return hasPlace(facts.venue, e.place || (ctx.spotId ? null : ctx.place));
  };
  // the outcome's own pool first; '.any' only when nothing in it fits
  let entry = null;
  for (const k of keys) {
    const fits = (STORY_POOLS[k] || []).filter(e => placeOk(e) && Object.entries(e.when || {}).every(([f, v]) => (Array.isArray(v) ? v.includes(facts[f]) : facts[f] === v)));
    // nobody plays the same scene twice in a season: once everything that fits has been said
    // by one of these people, the moment airs in its own short words instead (director.js)
    const saidBy = ledger().by || {};
    for (let i = fits.length - 1; i >= 0; i--) if (speakers.some(sp => (saidBy[fits[i].id] || []).includes(sp))) fits.splice(i, 1);
    if (!fits.length) continue;
    entry = pickEntry(ledger(), { [k]: fits }, k, facts, pairKey, rng, speakers, ctx.ep * 10 + (ctx.phase === 'post' ? 2 : 0));
    if (entry) break;
  }
  if (!entry) return null;
  // Where it is staged: the entry's own kind of place, else where the engine put the moment,
  // else the pool's default kind. The lines say it as {here} ("on the dock") or {place}.
  const avoid = ctx.avoid || null;
  const engineKind = ctx.spotId ? kindOf(facts.venue, ctx.spotId) : null;
  const spot = entry.place ? placeOf(facts.venue, entry.place, rng(), avoid)
    : ctx.spotId && !(avoid?.has(ctx.spotId) && engineKind) ? placeById(ctx.spotId)
      : placeOf(facts.venue, engineKind || ctx.place || 'public', rng(), avoid);
  if (spot && avoid && spot.id !== 'confessional') avoid.add(spot.id);
  data = { ...data, here: spot?.here || 'around camp', place: spot?.said || 'camp' };
  // a turn for a part nobody plays (no {c} in this scene) is dropped, never left blank
  const lines = entry.turns.filter(t => !t.by || who[t.by]).map(t => {
    const kind = t.conf ? 'conf' : t.beat ? 'beat' : 'say';
    const text = fill(t.conf || t.beat || t.say, who, data);
    return { kind, by: t.by ? who[t.by] : null, text: text.charAt(0).toUpperCase() + text.slice(1) };
  });
  if (lines.some(l => /\{\w+(\.\w+)?\}/.test(l.text))) throw new Error(`td story ${entry.id}: unfilled slot in "${lines.find(l => /\{\w+/.test(l.text)).text}"`);
  return { lines, text: transcript(lines), lineId: entry.id, spot: spot ? { id: spot.id, label: spot.label } : null };
}
