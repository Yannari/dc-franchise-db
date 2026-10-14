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
import { gs, players } from '../../core.js';
import { pickEntry, chooseEntry, newLedger } from '../../script/pick.js';
// a scene written in draft (ctx.draft) is only proposed: what it spends (its lines, its place, the season's count of
// it) is spent when the director accepts it (commit.js), keyed to its lines, which the scene built from it carries
import { onCommit } from './commit.js';
import { stableRng } from '../../script/rng.js';
import { fill, transcript, salt } from '../script/write.js';
import { STORY_POOLS } from './lines/index.js';
import { hasPlace, placeOf, placeById, kindOf, PLACES } from './places.js';
const PLACES_OF = venue => PLACES[venue] || PLACES['hosted-camp'];
import { foodOk } from '../script/food.js';
import { voiceOf, voiced } from './voice.js';
import { phrase } from './phrase.js';
import { DOING, GROUP, PAIR, SECRET, CROWD } from './setup.js';
import { tidySpoken, tidyNames } from '../../vp-tr/tidy.js';
import { pastOf, pastData, isReturnee } from '../past.js';
import KITS from './kits/index.js';
import { activeFranchise } from '../../franchise-meta.js';

// a place a scene's stage directions name outright (a beat, never a {here}): the spot it must be staged at
const NAMED_SPOTS = [
  [/\bthe (end of the )?dock\b/i, 'dock'], [/\bthe fire\b|\bfire pit\b|\bcampfire\b/i, 'fire'], [/\bboathouse\b/i, 'boathouse'],
  [/\bwaterfall\b/i, 'waterfall'], [/\bmess hall\b/i, 'mess-hall'], [/\bcabin porch\b/i, 'cabins'], [/\bcabin roof\b/i, 'cabins'],
];
function namedSpot(entry, venue) {
  const text = (entry.turns || []).filter(t => t.beat).map(t => t.beat).join(' ');
  if (!text) return null;
  const table = PLACES_OF(venue);
  for (const [rx, id] of NAMED_SPOTS) {
    if (!rx.test(text)) continue;
    if (id === 'fire') return (table.fire || []).length ? placeOf(venue, 'fire', 0) : null;
    return Object.values(table).some(l => l.includes(id)) ? placeById(id) : null;
  }
  return null;
}

// What has aired in this franchise's past seasons, scene by scene (the user, 2026-10-10: "the first day
// seems to roll always the same events"; measured: one banter scene aired on day one in 12 seasons of 12).
// Kept on the active franchise, so it's saved with the franchise ledger and survives into the next season;
// a franchise is the user's own run of seasons, so two franchises don't share it. Built-from-kit scenes
// (ids 'kit:...') are one person's own lines and never repeat anyway: they aren't counted.
function storySeen() {
  try { const af = activeFranchise(); return (af.storySeen ||= {}); } catch { return {}; }
}

// what each venue does not have (places.js PLACES): Wawanakwa sleeps in cabins on a lake, the survival
// island has a beach and a shelter and no mess hall, the carnival camp has tents by a lake, the film
// lot is trailers and sets, the jet is the jet (OUTDOOR below); only the camp and the island come and go by boat
// (read 2026-10-14: "the boat is not getting any younger" on the film lot and the jet)
const VENUE_NO = {
  'hosted-camp': /\b(shelter|jungle|coconuts?|ocean|the sea|seaweed|tide)\b/i,
  'survival-island': /\b(cabins?|mess hall|dock|boathouse|the lake|lake shore|bunks?)\b/i,
  carnival: /\b(boats?|cabins?|mess hall|dock|boathouse|jungle|coconuts?|ocean|the sea|seaweed|tide)\b/i,
  'film-lot': /\b(boats?|shelter|cabins?|mess hall|dock|boathouse|lake|beach|shore(line)?|ocean|the sea|sand|seaweed|tide|crabs?|shells?|jungle|coconuts?|fire( pit)?|campfire|firewood|fishing|tent|woods|forest|water pump|the well)\b/i,
  'world-tour': /\b(boats?|dock|mess hall|crabs?|shells?|seaweed|tide|coconuts?|water pump|the well|bunks?)\b/i,
};
const OUTDOOR = /\b(fire( pit)?|outhouse|in the dirt|fix the roof|on the roof|before it rains|(carry(ing)?|fetch(ing)?|get(ting)?) (the )?water|water runs?|buckets?|outdoors|outside|skylight|hole in the roof|raining|rain|berries|away from camp|from camp|the path|firewood|campfire|fishing|fish|lake|water's edge|the water|sand|beach|dock|log|shore|tent|shelter|woods?|forest|stones?|pebbles?|bush(es)?|sun|shade|rocks?|trees?|river|waterfall|trail|caves?|shoreline|across camp|around camp|side of camp)\b/i;
// A line for a place the season has, by its words (also kits.js take: a character's own lines go through it)
export function venueTextOk(venue, text) {
  if (venue === 'world-tour' && OUTDOOR.test(text)) return false;
  if (VENUE_NO[venue]?.test(text)) return false;
  return true;
}
// Time logic (the user, 2026-10-08: day one had "it's always a joke with you", a challenge brag
// before the challenge, a five a.m. airhorn in the afternoon).
// A line that leans on shared history, in the first two episodes, between two people with none.
const HISTORY = /\b(always|you never|never once|every time|every single time|again|anymore|any more|lately|like before|used to|last time|the other day|yesterday|since day one|all week|for days)\b/i;
// After the challenge it is not the morning; before it, nobody can talk about how it went.
const MORNING = /\b(breakfast|good morning|morning,|this morning\.|sunrise|wakes? up|woke up|before everyone's up|first thing|morning chores|everyone else is asleep|light comes? up)\b|\bmorning!|^early\.|\(early\./i;
const EVENING = /\b(dinner|lights-out|lights out|goodnight|good night|after the challenge|gone to bed|still up|last ones still up|last two still up)\b|^late,|\(late,/i;
const CHAL_DONE = /\b(we lost|we won|lost it for us|lost us|carried us|dead last|lowest score|best score|the challenge today|today's challenge was|out there today|the worst one out there)\b/i;
const ledger = () => ((gs.tdStory ||= {}).ledger ||= newLedger());
// an entry by its words: its first spoken line, as written (the same template under two ids is the same scene)
const entryKey = e => { const t = (e?.turns || []).find(x => x.say || x.conf); return t ? String(t.say || t.conf).slice(0, 80) : String(e?.id || ''); };
// every pool entry's words, by id (built once: the pools are fixed at load)
const keyOfId = new Map();
for (const pool of Object.values(STORY_POOLS)) for (const e of pool) if (e?.id && !keyOfId.has(e.id)) keyOfId.set(e.id, entryKey(e));

export const hasStoryPool = pool => !!(STORY_POOLS[`${pool}.any`]?.length || Object.keys(STORY_POOLS).some(k => k.startsWith(pool + '.')));

const keysFor = (pool, outcome) => [`${pool}.${outcome || 'any'}`, `${pool}.any`].filter((k, i, a) => a.indexOf(k) === i && STORY_POOLS[k]?.length);

/**
 * Write one scene. `who` names the parts ({a, b, c, d}); `data` the names a line may say
 * ({lastBoot}, {target}, {alliance}...); `facts` what a line's `when` may ask.
 * Returns { lines, text, lineId } or null when no pool fits.
 */
export function writeStory(pool, outcome, who, data, facts, ctx) {
  const later = [];
  const spend = fn => (ctx?.draft ? later.push(fn) : fn());
  // who is in the scene: b present or not ('pair'), checked like third/fourth (lines/index.js)
  facts = { ...facts, pair: !!who.b, third: facts.third ?? !!who.c, fourth: facts.fourth ?? !!who.d, fifth: !!who.e, sixth: !!who.f };
  // who has played before, and what kind of season they had (td/past.js, from the ledger): a scene written for
  // somebody new doesn't play for a returnee, and a returnee's scene can say what really happened last time
  // ({lastSeason}, {lastPlace}, {lastBy}, {lastPartner}; the same with B for b)
  { const pa = pastOf(who.a), pb = pastOf(who.b);
    facts = { ...facts, returnee: facts.returnee ?? isReturnee(who.a), returneeB: facts.returneeB ?? isReturnee(who.b),
      past: pa?.kind || 'none', pastB: pb?.kind || 'none', pastEnd: pa?.end || 'none', pastBy: !!pa?.by, pastPartnerHere: !!pa?.partner && Object.values(who).includes(pa.partner) };
    data = { ...pastData(who.a), ...pastData(who.b, 'B'), ...(data || {}) };
    // ...and the one the scene is about ({target}): a vote against somebody who won last time can say so
    if (data.target && facts.targetPast === undefined) {
      const pt = pastOf(data.target);
      // targetWronged: the target is the one who blindsided or betrayed a last time (payback)
      facts = { ...facts, targetPast: pt?.kind || 'none', targetEnd: pt?.end || 'none', targetWronged: !!pa?.by && pa.by === data.target };
      if (pt) data = { ...pastData(data.target, 'T'), ...data };
    } }
  const keys = keysFor(pool, outcome);
  if (!keys.length) return null;
  const rng = stableRng('td-story', salt(), ctx.ep, ctx.camp || '', ctx.phase || '', pool, who.a || '', who.b || '', ctx.n || 0);
  const speakers = Object.values(who).filter(Boolean);
  const pairKey = [who.a, who.b].filter(Boolean).sort().join('|');
  // A scene staged somewhere the season does not have is out: no campfire or fishing on the
  // World Tour jet, no coconuts anywhere but the survival island.
  const placeOk = e => {
    const text = (e.turns || []).map(t => t.beat || t.say || t.conf || '').join(' ');
    if (!venueTextOk(facts.venue, text)) return false;
    // ...and nothing that names a place this venue doesn't have (the user, 2026-10-08: "make sure the
    // events respect the venue always"): places.js says what each one has
    if (VENUE_NO[facts.venue]?.test(text)) return false;
    if (facts.venue !== 'survival-island' && /coconut/i.test(text)) return false;
    if (!foodOk(facts.venue, text)) return false;
    // strangers don't share a past: no "always" or "again" early on unless they really have one
    // (a returnee's own entrance may talk about their last season: that past is theirs, not shared)
    const strangers = (ctx.ep || 0) <= 2 && (facts.hist || 'none') === 'none' && (facts.prev || 'none') === 'none' && !(facts.returnee && !who.b);
    if (strangers && !e.past && HISTORY.test(text)) return false;
    // before the season's first vote nobody has been voted for, or nearly
    // (a returnee's scene about last season is exempt: e.past, lines/n-returnee.js)
    if (!facts.voteYet && !e.past && /\b(voted|last vote|the vote last|wrote (my|your|his|her|their) name|on the edge of a vote|been on the edge|last night)\b/i.test(text)) return false;
    // the time of day and the order of the day
    if (ctx.phase === 'post' && MORNING.test(text)) return false;
    if (ctx.phase === 'pre' && EVENING.test(text)) return false;
    if (ctx.phase === 'pre' && !facts.merged && CHAL_DONE.test(text)) return false;
    if (ctx.phase === 'pre' && facts.merged && CHAL_DONE.test(text) && !/immunity/.test(text)) return false;
    // the kind of place the scene needs (places.js): the venue must have one
    return hasPlace(facts.venue, e.place || (ctx.spotId ? null : ctx.place));
  };
  // Day-one conversations have their own strict line ledger. Other story families keep their
  // existing reuse policy (for example the voting booth must always be able to speak).
  const firstImpressions = ctx.firstImpressions || /^story.first(pair|group)$/.test(pool);
  const firstLines = () => ((gs.tdStory ||= {}).firstImpressionLines ||= []);
  const lineKey = x => String(x || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const ownWords = (e, t) => t.beat || voiced(t, who[t.by], e.place === 'secret', x => placeOk({turns:[{say:x}]}));
  // the outcome's own pool first; '.any' only when nothing in it fits
  let entry = null;
  const fitsFor = k => {
    // `voice` / `voiceB` ask for one of a or b's voice tags (voice.js); everything else is a fact
    // (a schemer's charm is 'warm' too, but a line written for the scared and the soft is not theirs: Alejandro, "My
    // heart was going so fast. I just want everybody to be okay", read 2026-10-14)
    const SOFT = ['anxious', 'emotional', 'earnest'];
    const voiceFit = (want, name) => { const w = [].concat(want), v = voiceOf(name), hits = w.filter(t => v.includes(t));
      if (!hits.length) return false;
      if (w.some(t => SOFT.includes(t)) && hits.every(t => t === 'warm') && v.some(t => t === 'schemer' || t === 'cruel')) return false;
      return true; };
    const fits = (STORY_POOLS[k] || []).filter(e => (!ctx.entryIds || ctx.entryIds.includes(e.id)) && placeOk(e) &&
      (!firstImpressions || e.turns.every(t => t.by && !who[t.by] || !firstLines().includes(lineKey(ownWords(e,t))))) && Object.entries(e.when || {}).every(([f, v]) =>
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
    // ...and never twice in one episode, between two different sets of people (read in a played season:
    // the same 'overheard' confessional twice in one evening). Kept only while something else fits.
    // (by its words too: one template copied under several ids, a vote count written once for every case, is one scene;
    // read 2026-10-12: Gwen and Lake both "Even if one of ours flips, we've still got the numbers" in one evening).
    // ctx.epFresh: nothing at all rather than a repeat, for a part of a scene that can go without it
    // ...nor one a draft already holds this episode: a proposal spends its line only if it airs (commit.js), so without
    // this, several drama scenes proposed in one stretch of the day all took the same fresh reaction and the episode aired
    // it twice (measured 2026-10-14: 155 of 560 episodes once the day aired the game's own story)
    const eu = gs.tdStory?.epUsed, ed = gs.tdStory?.epDraft;
    const heldEp = e => (eu && eu.ep === ctx.ep && (eu.ids.includes(e.id) || (eu.keys || []).includes(entryKey(e)))) || (ed && ed.ep === ctx.ep && (ed.ids.includes(e.id) || ed.keys.includes(entryKey(e))));
    if (ctx.unique !== false && ((eu && eu.ep === ctx.ep) || (ed && ed.ep === ctx.ep))) { const rest = fits.filter(e => !heldEp(e)); if (rest.length || ctx.epFresh) fits.splice(0, fits.length, ...rest); }
    // a scene's season count is by its id and by its words (keyUses): one template copied under several ids (the vote
    // talk's glue and math scenes, one copy per reason) is one scene, used once
    const idUses = ledger().uses || {}, keyUses = gs.tdStory?.keyUses || {};
    const uses = new Proxy({}, { get: (_, id) => Math.max(idUses[id] || 0, keyUses[keyOfId.get(id)] || 0) });
    if (ctx.unique === 'soft' && fits.length && fits.every(e => uses[e.id])) {
      const least = Math.min(...fits.map(e => uses[e.id]));
      for (let i = fits.length - 1; i >= 0; i--) if (uses[fits[i].id] > least) fits.splice(i, 1);
      // ...and of those, not one these people already said, nor one heard in the last two episodes, while anything else
      // is left (read 2026-10-14: Jo's "Everybody listen up! We can't keep losing like that!" word for word two episodes
      // running, the loud voice's own entry winning again once the pool had all aired once)
      const lastDay = ledger().day || {}, now = (ctx.ep || 0) * 10;
      const stale = e => speakers.some(sp => (saidBy[e.id] || []).includes(sp)) || (lastDay[e.id] != null && now - lastDay[e.id] <= 20);
      const rest = fits.filter(e => !stale(e));
      if (rest.length) fits.splice(0, fits.length, ...rest);
    } else if (ctx.unique !== false) for (let i = fits.length - 1; i >= 0; i--) if (uses[fits[i].id]) fits.splice(i, 1);
    // the speaker's own voice first: a scene written for one of a's strongest tags (their first three)
    // wins over one that only fits the archetype or the stats (the user: an underdog with a temper
    // should not sound like a doormat)
    if (firstImpressions && fits.length) {
      const most = Math.max(...fits.map(e => Object.keys(e.when || {}).length));
      for(let i=fits.length-1;i>=0;i--) if(Object.keys(fits[i].when || {}).length < most) fits.splice(i,1);
    }
    const top = voiceOf(who.a).slice(0, 3);
    // (a scene whose lines for a are moves is in a's voice by construction: phrase.js says them)
    // ...and a scene written for what really happened to a last time (td/past.js) over one that only fits
    // their voice: a first-out returnee gets the first-out entrance, not the generic one
    let mine = fits.filter(e => [].concat(e.when?.voice || []).some(t => top.includes(t)) || (e.turns || []).some(t => t.by === 'a' && t.move)
      || (e.past && e.when?.past !== undefined && facts.past !== 'none') || (e.past && e.when?.pastB !== undefined && facts.pastB !== 'none'));
    // On the dock, a scene written for a's archetype beats one written for a voice a has only been guessed
    // to have from the stats (the user, 2026-10-10, 'the writing is horrendous': Scarlett, a villain, arrived
    // with snacks for anybody feeling sick, the warm voice's entrance). An authored voice still wins.
    if (/^arrive\./.test(keys[0] || '') && facts.arch && !(players.find(p => p.name === who.a)?.voiceTags || []).length) {
      const byArch = fits.filter(e => [].concat(e.when?.arch || []).includes(facts.arch));
      if (byArch.length) mine = byArch;
    }
    // ...and a whole conversation over a sketch (the user, 2026-10-08: "I'm tired of 4/5 line events that
    // tell nothing"): when a pool has a version of six spoken lines or more for these people, a short one
    // only airs when no long one fits. A pool of one-liners (the booth, a recall) is left as it is.
    const said = e => (e.turns || []).filter(t => t.by && who[t.by] && (t.say || t.conf || t.move || t.v)).length;
    // "long" is near the longest that fits, five lines at the least: a strict six left a pool of six
    // versions with two that could ever air, the same two every season
    const longOf = list => { const top = Math.max(0, ...list.map(said)); return top >= 6 ? list.filter(e => said(e) >= Math.max(5, top - 1)) : []; };
    // Across seasons first: only the versions this franchise has seen least are in the running (storySeen
    // above), and the voice and length preferences choose among those. The other way round, a loud speaker
    // got the one loud version every season.
    const seen = storySeen();
    const low = Math.min(...fits.map(e => seen[e.id] || 0));
    const fresh2 = fits.filter(e => (seen[e.id] || 0) === low);
    const mine2 = mine.filter(e => fresh2.includes(e));
    const pool = longOf(mine2).length ? longOf(mine2) : longOf(fresh2).length ? longOf(fresh2) : mine2.length ? mine2 : fresh2;
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
    const clock = ctx.ep * 10 + (ctx.phase === 'post' ? 2 : 0);
    const picked = ctx.draft ? (c => c && (later.push(c.note), c.entry))(chooseEntry(ledger(), { [k]: bare }, k, facts, pairKey, rng, speakers, clock))
      : pickEntry(ledger(), { [k]: bare }, k, facts, pairKey, rng, speakers, clock);
    entry = picked ? fits[bare.indexOf(picked)] || picked : null;
    if (entry) break;
  }
  if (!entry) return null;
  spend(() => { const book = (gs.tdStory ||= {}); if (!book.epUsed || book.epUsed.ep !== ctx.ep) book.epUsed = { ep: ctx.ep, ids: [], keys: [] }; book.epUsed.ids.push(entry.id); (book.epUsed.keys ||= []).push(entryKey(entry)); });
  // a draft holds its entry for the rest of the episode at once (above), aired or not
  if (ctx?.draft) { const book = (gs.tdStory ||= {}); if (!book.epDraft || book.epDraft.ep !== ctx.ep) book.epDraft = { ep: ctx.ep, ids: [], keys: [] }; book.epDraft.ids.push(entry.id); book.epDraft.keys.push(entryKey(entry)); }
  if (!/^kit:/.test(entry.id || '')) spend(() => { const seen = storySeen(); seen[entry.id] = (seen[entry.id] || 0) + 1; });
  // the season's count of these words (the once-a-season rule above reads it with the id's own count)
  spend(() => { const k = (gs.tdStory ||= {}).keyUses ||= {}; const key = entryKey(entry); k[key] = (k[key] || 0) + 1; });
  // Where it is staged: the entry's own kind of place, else where the engine put the moment,
  // else the pool's default kind. The lines say it as {here} ("on the dock") or {place}.
  // a meal is where the camp eats, all of it together, at mealtime: it never makes way for another talk
  const meal = entry.place === 'eat' || ctx.place === 'eat' && !entry.place;
  const avoid = meal ? null : (ctx.avoid || null);
  const engineKind = ctx.spotId ? kindOf(facts.venue, ctx.spotId) : null;
  // a scene whose own stage directions say where it is ("on the end of the dock", "around the fire") is staged there,
  // when this venue has it (read 2026-10-14: "Gwen is sitting on the end of the dock" aired at the river, "Millie is
  // writing in her journal by the fire" at the river)
  const namedAt = meal ? null : namedSpot(entry, facts.venue);
  const spot = meal ? placeOf(facts.venue, 'eat', 0)
    : namedAt ? namedAt
    : entry.place ? placeOf(facts.venue, entry.place, rng(), avoid)
    : ctx.spotId && !(avoid?.has(ctx.spotId) && engineKind) ? placeById(ctx.spotId)
      : placeOf(facts.venue, engineKind || ctx.place || 'public', rng(), avoid);
  // (the place is held at once, even for a proposal: two proposals in one call must not both take it; holding a place
  // spends no story, so a scene cut later costs nothing but the spot for that stretch of the day)
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
    let raw = t.beat || (t.move ? null : voiced(t, t.by ? who[t.by] : null, hush, x => placeOk({ turns: [{ say: x }] })));
    if (t.move) {
      const toRole = t.to || (lastBy && lastBy !== t.by ? lastBy : Object.keys(who).find(r => r !== t.by && r !== 'h' && who[r]));
      raw = phrase(t.move, who[t.by], rng, { to: !!(toRole && who[toRole]) }) || '...';
      raw = raw.replace(/\{to(\.\w+)?\}/g, (m, part) => `{${toRole}${part || ''}}`).replace(/\{by(\.\w+)?\}/g, (m, part) => `{${t.by}${part || ''}}`);
    }
    if (t.by && !t.conf) lastBy = t.by;
    // a name said again in the same sentence becomes a pronoun, "they" takes its verb (the user:
    // "repeating Mike too many times"): spoken lines and confessionals by tidySpoken, beats by tidyNames
    raw = raw.replace(/\{([ab])\.thing\}/g, (slot,role) => KITS[who[role]]?.thing || slot);
    const filled = fill(raw, who, data);
    const text = kind === 'beat' ? tidyNames(filled) : tidySpoken(filled);
    // a sentence starts with a capital, a number word filled in included (read 2026-10-14: "Three votes. three people
    // wrote Evie's name"); a trailing-off "..." is the same sentence going on ("Is that... it is")
    const text1 = text.replace(/(^|[^.][.!?]["”]?\s+)([a-z])/g, (m, pre, c) => pre + c.toUpperCase());
    const line = { kind, by: t.by ? who[t.by] : null, text: text1.charAt(0).toUpperCase() + text1.slice(1) };
    // the scene moves (goes: the people in the rest of it walk somewhere else) or somebody walks in (comes)
    if (t.goes) line.goes = true;
    if (t.comes && who[t.comes]) line.arrive = [who[t.comes]];
    // which turn of the entry it came from, for the voice-coverage measurement (not saved: non-enumerable)
    Object.defineProperty(line, 'turn', { value: entry.turns.indexOf(t) });
    return line;
  });
  // the set-up line (td/story/setup.js): a scene that opens on dialogue is first set somewhere, with
  // who finds whom and what they were doing. Marked auto, so a chained scene can trade it for an arrival.
  // (not on the dock: an arrival is somebody stepping off the boat, staged by its own screen, ctx.noSetup)
  // (an entry that stages itself a line or two in is set already: "catches Bridgette alone" then "pulls Bridgette and
  // the others aside", read 2026-10-11)
  if (spot && !ctx.noSetup && spot.id !== 'confessional' && lines.length && !lines.slice(0, 3).some(l => l.kind === 'beat') && lines.some(l => l.kind === 'say')) {
    const set = setupLine(entry, who, data, lines, spot, facts, ctx, rng, placeOk);
    if (set) lines.unshift(set);
  }
  if (lines.some(l => /\{\w+(\.\w+)?\}/.test(l.text))) throw new Error(`td story ${entry.id}: unfilled slot in "${lines.find(l => /\{\w+/.test(l.text)).text}"`);
  // breakfast is the morning; dinner is the evening (camp-access.js windows)
  const window = meal ? (ctx.phase === 'pre' ? 'morning' : 'before-tribal') : null;
  // who the scene actually has in it: the roles that speak, or that the lines name. The viewer stages
  // scene.who, so a role the entry never uses is a silent extra on stage (the user, 2026-10-10: "it's a 4
  // person scene but no one talking but the 2 girls"); director.js keeps only these
  const usedRoles = Object.keys(who).filter(r => who[r] && entry.turns.some(t => (t.by === r && (!t.when || turnOk(t))) || named(t).includes(r)));
  if (firstImpressions) for (const t of entry.turns) {
    if(t.by && !who[t.by]) continue;
    spend(() => firstLines().push(lineKey(ownWords(entry,t))));
  }
  if (later.length) onCommit(lines, () => later.forEach(fn => fn()));
  return { lines, text: transcript(lines), lineId: entry.id, cast: usedRoles, spot: spot ? { id: spot.id, label: spot.label, fixed: true, ...(window ? { window } : {}) } : null };
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
