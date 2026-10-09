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
import { foodOk } from '../script/food.js';
import { voiceOf, voiced } from './voice.js';
import { phrase } from './phrase.js';
import { DOING, GROUP, PAIR, SECRET, CROWD } from './setup.js';
import { tidySpoken, tidyNames } from '../../vp-tr/tidy.js';

// what each venue does not have (places.js PLACES): Wawanakwa sleeps in cabins on a lake, the survival
// island has a beach and a shelter and no mess hall, the carnival camp has tents by a lake, the film
// lot is trailers and sets, the jet is the jet (OUTDOOR below)
const VENUE_NO = {
  'hosted-camp': /\b(shelter|jungle|coconuts?|ocean|the sea|seaweed|tide)\b/i,
  'survival-island': /\b(cabins?|mess hall|dock|boathouse|the lake|lake shore|bunks?)\b/i,
  carnival: /\b(cabins?|mess hall|dock|boathouse|jungle|coconuts?|ocean|the sea|seaweed|tide)\b/i,
  'film-lot': /\b(shelter|cabins?|mess hall|dock|boathouse|lake|beach|shore(line)?|ocean|the sea|sand|seaweed|tide|crabs?|shells?|jungle|coconuts?|fire( pit)?|campfire|firewood|fishing|tent|woods|forest|water pump|the well)\b/i,
  'world-tour': /\b(mess hall|crabs?|shells?|seaweed|tide|coconuts?|water pump|the well|bunks?)\b/i,
};
const OUTDOOR = /\b(fire( pit)?|firewood|campfire|fishing|fish|lake|water's edge|the water|sand|beach|dock|log|shore|tent|shelter|woods?|forest|stones?|pebbles?|bush(es)?|sun)\b/i;
// Time logic (the user, 2026-10-08: day one had "it's always a joke with you", a challenge brag
// before the challenge, a five a.m. airhorn in the afternoon).
// A line that leans on shared history, in the first two episodes, between two people with none.
const HISTORY = /\b(always|you never|never once|every time|every single time|again|anymore|any more|lately|like before|used to|last time|the other day|yesterday|since day one|all week|for days)\b/i;
// After the challenge it is not the morning; before it, nobody can talk about how it went.
const MORNING = /\b(breakfast|good morning|morning,|this morning\.|sunrise|wakes? up|woke up|before everyone's up|first thing)\b/i;
const EVENING = /\b(dinner|lights-out|lights out|goodnight|good night|after the challenge)\b/i;
const CHAL_DONE = /\b(we lost|we won|lost it for us|lost us|carried us|dead last|lowest score|best score|the challenge today|today's challenge was|out there today|the worst one out there)\b/i;
const ledger = () => ((gs.tdStory ||= {}).ledger ||= newLedger());

export const hasStoryPool = pool => !!(STORY_POOLS[`${pool}.any`]?.length || Object.keys(STORY_POOLS).some(k => k.startsWith(pool + '.')));

const keysFor = (pool, outcome) => [`${pool}.${outcome || 'any'}`, `${pool}.any`].filter((k, i, a) => a.indexOf(k) === i && STORY_POOLS[k]?.length);

/**
 * Write one scene. `who` names the parts ({a, b, c, d}); `data` the names a line may say
 * ({lastBoot}, {target}, {alliance}...); `facts` what a line's `when` may ask.
 * Returns { lines, text, lineId } or null when no pool fits.
 */
export function writeStory(pool, outcome, who, data, facts, ctx) {
  // who is in the scene: b present or not ('pair'), checked like third/fourth (lines/index.js)
  facts = { ...facts, pair: !!who.b, third: facts.third ?? !!who.c, fourth: facts.fourth ?? !!who.d, fifth: !!who.e, sixth: !!who.f };
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
    // ...and nothing that names a place this venue doesn't have (the user, 2026-10-08: "make sure the
    // events respect the venue always"): places.js says what each one has
    if (VENUE_NO[facts.venue]?.test(text)) return false;
    if (facts.venue !== 'survival-island' && /coconut/i.test(text)) return false;
    if (!foodOk(facts.venue, text)) return false;
    // strangers don't share a past: no "always" or "again" early on unless they really have one
    // (a returnee's own entrance may talk about their last season: that past is theirs, not shared)
    const strangers = (ctx.ep || 0) <= 2 && (facts.hist || 'none') === 'none' && (facts.prev || 'none') === 'none' && !(facts.returnee && !who.b);
    if (strangers && HISTORY.test(text)) return false;
    // before the season's first vote nobody has been voted for, or nearly
    if (!facts.voteYet && /\b(voted|last vote|the vote last|wrote (my|your|his|her|their) name|on the edge of a vote|been on the edge|last night)\b/i.test(text)) return false;
    // the time of day and the order of the day
    if (ctx.phase === 'post' && MORNING.test(text)) return false;
    if (ctx.phase === 'pre' && EVENING.test(text)) return false;
    if (ctx.phase === 'pre' && !facts.merged && CHAL_DONE.test(text)) return false;
    if (ctx.phase === 'pre' && facts.merged && CHAL_DONE.test(text) && !/immunity/.test(text)) return false;
    // the kind of place the scene needs (places.js): the venue must have one
    return hasPlace(facts.venue, e.place || (ctx.spotId ? null : ctx.place));
  };
  // the outcome's own pool first; '.any' only when nothing in it fits
  let entry = null;
  const fitsFor = k => {
    // `voice` / `voiceB` ask for one of a or b's voice tags (voice.js); everything else is a fact
    const voiceFit = (want, name) => [].concat(want).some(t => voiceOf(name).includes(t));
    const fits = (STORY_POOLS[k] || []).filter(e => placeOk(e) && Object.entries(e.when || {}).every(([f, v]) =>
      f === 'voice' ? voiceFit(v, who.a) : f === 'voiceB' ? voiceFit(v, who.b) : f === 'voiceC' ? voiceFit(v, who.c)
        // `notVoice`: a line that is wrong in this mouth (a meek line for a loud speaker)
        : f === 'notVoice' ? !voiceFit(v, who.a) : f === 'notVoiceB' ? !voiceFit(v, who.b)
        : (Array.isArray(v) ? v.includes(facts[f]) : facts[f] === v)));
    // nobody plays the same scene twice in a season: once everything that fits has been said
    // by one of these people, the moment airs in its own short words instead (director.js)
    const saidBy = ledger().by || {};
    const fresh = fits.filter(e => !speakers.some(sp => (saidBy[e.id] || []).includes(sp)));
    if (fresh.length || ctx.unique !== 'soft') fits.splice(0, fits.length, ...fresh);
    // ...and a whole scene airs once a season, whoever is in it (the user: "no repetitiveness across
    // the season"); the booth, where every voter needs a line every vote, only keeps the rule above
    // A scene every vote needs (the vote talked through, director.js voteTalk) is 'soft': once every
    // fresh one has aired, the least-aired comes back rather than the vote going unexplained
    const uses = ledger().uses || {};
    if (ctx.unique === 'soft' && fits.length && fits.every(e => uses[e.id])) {
      const least = Math.min(...fits.map(e => uses[e.id]));
      for (let i = fits.length - 1; i >= 0; i--) if (uses[fits[i].id] > least) fits.splice(i, 1);
    } else if (ctx.unique !== false) for (let i = fits.length - 1; i >= 0; i--) if (uses[fits[i].id]) fits.splice(i, 1);
    // the speaker's own voice first: a scene written for one of a's strongest tags (their first three)
    // wins over one that only fits the archetype or the stats (the user: an underdog with a temper
    // should not sound like a doormat)
    const top = voiceOf(who.a).slice(0, 3);
    // (a scene whose lines for a are moves is in a's voice by construction: phrase.js says them)
    const mine = fits.filter(e => [].concat(e.when?.voice || []).some(t => top.includes(t)) || (e.turns || []).some(t => t.by === 'a' && t.move));
    // ...and a whole conversation over a sketch (the user, 2026-10-08: "I'm tired of 4/5 line events that
    // tell nothing"): when a pool has a version of six spoken lines or more for these people, a short one
    // only airs when no long one fits. A pool of one-liners (the booth, a recall) is left as it is.
    const said = e => (e.turns || []).filter(t => t.by && who[t.by] && (t.say || t.conf || t.move || t.v)).length;
    const longOf = list => list.filter(e => said(e) >= 6);
    const pool = longOf(mine).length ? longOf(mine) : longOf(fits).length ? longOf(fits) : mine.length ? mine : fits;
    fits.splice(0, fits.length, ...pool);
    return fits;
  };
  // A scene cast with three or four people plays a scene written for all of them: the extra people
  // are not furniture (the user: "it's a whole conversation"). The outcome's own pool first, then
  // '.any' for a full-cast scene, and only then a pair scene with the others standing by.
  const listed = keys.map(k => [k, fitsFor(k)]);
  // ...measured by how many of the people in it get lines (a group scene may have optional parts,
  // `opt: true`, for a fifth or sixth person: they speak when they are there)
  const voices = e => new Set((e.turns || []).filter(t => t.by && who[t.by]).map(t => t.by)).size;
  const best = Math.max(0, ...listed.flatMap(([, f]) => f.map(voices)));
  const order = [...listed.map(([k, f]) => [k, f.filter(e => voices(e) === best)]).filter(([, f]) => f.length && best >= 3), ...listed];
  for (const [k, fits] of order) {
    if (!fits.length) continue;
    // pickEntry checks `when` again against the facts, and the facts hold no voices: the voice gates
    // were checked above, so it sees each entry without them (else no voiced entry ever aired)
    const VOICE_KEYS = ['voice', 'voiceB', 'voiceC', 'notVoice', 'notVoiceB'];
    const bare = fits.map(e => (e.when && VOICE_KEYS.some(x => x in e.when)
      ? { ...e, when: Object.fromEntries(Object.entries(e.when).filter(([x]) => !VOICE_KEYS.includes(x))) } : e));
    const picked = pickEntry(ledger(), { [k]: bare }, k, facts, pairKey, rng, speakers, ctx.ep * 10 + (ctx.phase === 'post' ? 2 : 0));
    entry = picked ? fits[bare.indexOf(picked)] || picked : null;
    if (entry) break;
  }
  if (!entry) return null;
  // Where it is staged: the entry's own kind of place, else where the engine put the moment,
  // else the pool's default kind. The lines say it as {here} ("on the dock") or {place}.
  // a meal is where the camp eats, all of it together, at mealtime: it never makes way for another talk
  const meal = entry.place === 'eat' || ctx.place === 'eat' && !entry.place;
  const avoid = meal ? null : (ctx.avoid || null);
  const engineKind = ctx.spotId ? kindOf(facts.venue, ctx.spotId) : null;
  const spot = meal ? placeOf(facts.venue, 'eat', 0)
    : entry.place ? placeOf(facts.venue, entry.place, rng(), avoid)
    : ctx.spotId && !(avoid?.has(ctx.spotId) && engineKind) ? placeById(ctx.spotId)
      : placeOf(facts.venue, engineKind || ctx.place || 'public', rng(), avoid);
  if (spot && avoid && spot.id !== 'confessional') avoid.add(spot.id);
  data = { ...data, here: spot?.here || 'around camp', place: spot?.said || 'camp' };
  // a turn for a part nobody plays (no {c} in this scene) is dropped, never left blank
  // an optional turn (opt: true) plays only when everyone it names is in the scene
  // a talk somewhere secret is said quietly: nobody shouts after checking nobody followed
  const hush = !!spot && spot.id !== 'confessional' && (kindOf(facts.venue, spot.id) === 'secret' || entry.place === 'secret');
  const named = t => [...[t.say, t.conf, t.beat, ...Object.values(t.v || {})].join(' ').matchAll(/\{([a-f])(?:\.\w+)?\}/g)].map(m => m[1]);
  let lastBy = null;
  // a turn may have its own condition (when: { tally: 'close' }, { shaky: true }): it plays only when the
  // facts say so, so one whole scene carries the line that only some nights have
  const turnOk = t => !t.when || Object.entries(t.when).every(([k, v]) => v === true ? !!facts[k] : v === false ? !facts[k]
    : Array.isArray(v) ? v.includes(facts[k]) : facts[k] === v);
  const lines = entry.turns.filter(t => (!t.by || who[t.by]) && !(t.opt && named(t).some(r => !who[r])) && turnOk(t)).map(t => {
    const kind = t.conf || t.asConf ? 'conf' : t.beat ? 'beat' : 'say';
    // A move (`move: 'pushback'`) is said in the speaker's own words, from the phrasebook
    // (td/story/phrase.js): their voice, their age. {to} is whoever they answer (the turn's `to`,
    // else the last other speaker), {by} the speaker.
    let raw = t.beat || (t.move ? null : voiced(t, t.by ? who[t.by] : null, hush));
    if (t.move) {
      const toRole = t.to || (lastBy && lastBy !== t.by ? lastBy : Object.keys(who).find(r => r !== t.by && r !== 'h' && who[r]));
      raw = phrase(t.move, who[t.by], rng, { to: !!(toRole && who[toRole]) }) || '...';
      raw = raw.replace(/\{to(\.\w+)?\}/g, (m, part) => `{${toRole}${part || ''}}`).replace(/\{by(\.\w+)?\}/g, (m, part) => `{${t.by}${part || ''}}`);
    }
    if (t.by && !t.conf) lastBy = t.by;
    // a name said again in the same sentence becomes a pronoun, "they" takes its verb (the user:
    // "repeating Mike too many times"): spoken lines and confessionals by tidySpoken, beats by tidyNames
    const filled = fill(raw, who, data);
    const text = kind === 'beat' ? tidyNames(filled) : tidySpoken(filled);
    const line = { kind, by: t.by ? who[t.by] : null, text: text.charAt(0).toUpperCase() + text.slice(1) };
    // which turn of the entry it came from, for the voice-coverage measurement (not saved: non-enumerable)
    Object.defineProperty(line, 'turn', { value: entry.turns.indexOf(t) });
    return line;
  });
  // the set-up line (td/story/setup.js): a scene that opens on dialogue is first set somewhere, with
  // who finds whom and what they were doing. Marked auto, so a chained scene can trade it for an arrival.
  if (spot && spot.id !== 'confessional' && lines.length && lines[0].kind !== 'beat' && lines.some(l => l.kind === 'say')) {
    const set = setupLine(entry, who, data, lines, spot, facts, ctx, rng, placeOk);
    if (set) lines.unshift(set);
  }
  if (lines.some(l => /\{\w+(\.\w+)?\}/.test(l.text))) throw new Error(`td story ${entry.id}: unfilled slot in "${lines.find(l => /\{\w+/.test(l.text)).text}"`);
  // breakfast is the morning; dinner is the evening (camp-access.js windows)
  const window = meal ? (ctx.phase === 'pre' ? 'morning' : 'before-tribal') : null;
  return { lines, text: transcript(lines), lineId: entry.id, spot: spot ? { id: spot.id, label: spot.label, fixed: true, ...(window ? { window } : {}) } : null };
}

// The set-up line for a scene that opens on dialogue (td/story/setup.js).
function setupLine(entry, who, data, lines, spot, facts, ctx, rng, placeOk) {
  const roleOf = n => Object.keys(who).find(r => who[r] === n);
  const said = [...new Set(lines.filter(l => l.kind === 'say' && l.by).map(l => l.by))];
  let [s1, s2] = said;
  if (!s2) s2 = Object.values(who).find(n => n && n !== s1);
  if (!s1 || !s2 || !roleOf(s1) || !roleOf(s2)) return null;
  // what the spot really is first (a dock is not the middle of camp), then what the scene asked for
  const kind = kindOf(facts.venue, spot.id) || entry.place || ctx.place || 'public';
  const phase = ctx.phase === 'post' ? 'post' : 'pre';
  const of = o => Array.isArray(o) ? o : [...(o?.[phase] || []), ...(o?.any || [])];
  const tag = n => `{${roleOf(n)}}`;
  const list = ns => ns.length <= 1 ? ns.join('') : `${ns.slice(0, -1).join(', ')} and ${ns[ns.length - 1]}`;
  const here = data.here || 'around camp';
  const cands = [];
  if (said.length >= 3) {
    for (const t of CROWD) for (const d of of(GROUP[kind] || GROUP.public)) cands.push(t.replace('{doing}', d));
  } else if (kind === 'secret') cands.push(...SECRET);
  else for (const t of PAIR) for (const d of of(DOING[kind] || DOING.public)) cands.push(t.replace('{doing}', d));
  // a stable shuffle, then the first that fits this venue and this time of day
  const order = cands.map(c => [rng(), c]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
  for (const raw of order) {
    const text0 = raw.split('{s1}').join(tag(s1)).split('{s2}').join(tag(s2)).split('{all}').join(list(said.map(tag)))
      .split('{here_cap}').join(here.charAt(0).toUpperCase() + here.slice(1)).split('{here}').join(here);
    const filled = tidyNames(fill(text0, who, data));
    if (!placeOk({ turns: [{ beat: filled }] })) continue;
    const line = { kind: 'beat', by: null, text: filled.charAt(0).toUpperCase() + filled.slice(1) };
    Object.defineProperty(line, 'auto', { value: true });
    Object.defineProperty(line, 'turn', { value: -1 });
    return line;
  }
  return null;
}
