// ══════════════════════════════════════════════════════════════════════
// rr/script/write.js — a decided scene becomes a short script
// ══════════════════════════════════════════════════════════════════════
//
// The engine has decided everything; this only picks words (manual §19.2 step 5), through the
// shared picker (js/script/pick.js) and its repetition rules: nobody says the same exchange
// twice in a season, nothing is heard twice in a leg, a pair never gets the same exchange again
// while anything else fits. The ledger is the season's (state.lineLedger); the clock is the leg.
//
// A pool entry is { id, when?, turns: [{ by, say | conf | beat, v?, id?, opt?, when?, keep? }] }:
//   say   said out loud, in the scene        conf  the interview chair        beat  a stage direction
//   by    a…f (rr/script/roles.js), don, local
//   v     variants by voice tag or family (sharp, dry, loud, soft, odd), and `rel:<family>` for how a
//         relationship says it (family, romantic, exes, friends, rivals)
//   id    an identity hook: the speaker's team says its own line there (identity.js)
// Voices as The Challenge's (ch/script/write.js): the archetype's voice speaks first, the Fiore
// rule (a hard voice never says an age variant), two loud or odd lines a speaker a scene.
import { players } from '../../core.js';
import { openerReady } from '../../vp-rr-ep/opener-shots.js';
import { pronouns } from '../../players.js';
import { pickEntry, newLedger } from '../../script/pick.js';
import { stableRng } from '../../script/rng.js';
import { voiceOf } from '../../td/story/voice.js';
import { FAMILY } from '../../td/story/voice-family-map.js';
import { POOLS } from './lines/index.js';
import { rolesOf, DON } from './roles.js';
import { SCENES, relFamOf } from '../scenes.js';
import { factsFor } from './facts.js';
import { identityLine } from './identity.js';
import { REL_TAGS } from './lines/premiere-rel-tags.js';
import { VET_TAGS } from './lines/premiere-vet-tags.js';
// a team bitter on both sides says so, to camera, after its introduction (Don's label no longer does)
const FEEL_TAGS = {
  strained: [
    "We're not really speaking at the moment. This race is supposed to fix that.",
    "Things between us are complicated right now. You'll see.",
    "We haven't been getting along. Everybody back home thinks this will help.",
  ],
};
import { metOn, sharedSeason } from '../past.js';
import { showName } from '../../shows.js';
import { handoverLine } from './lines/local-handover.js';
import { placeLocal, LOCALS } from '../../vp-rr-ep/locals.js';

// The moments the director makes itself, from the leg's record (not engine scenes): kind -> endings.
export const DIRECTOR_KINDS = {
  'task-start': ['any'],
  'task-try': ['first-try', 'after-fails', 'struggling', 'switched', 'quit'],
  'task-done': ['any'],
  // a stage of a staged challenge (director.js stageBeats): passed, or where it went wrong
  'task-stage': ['ok', 'fail'],
  // the system's own moments (tasks.js, travel.js, twists.js): one ending each
  'attempt-fail': ['any'], 'quit-task': ['any'], 'helped-botch': ['any'], 'allin-alone': ['any'],
  'travel-mishap': ['any'], 'found-flight': ['any'], 'same-flight': ['any'], 'express-used': ['any'],
  'yield-found': ['any'], 'yield-decide': ['any'],
  // a big cast (director.js BIG_CAST): Don checks in a team with no story this leg in a line, and the clean
  // runs of teams like it at a task are shown together ({teams} names them)
  'mat-montage': ['any'], 'task-montage': ['any'],
  // the rest of the field taking its clue at a challenge's checkpoint, a beat a team (director.js, scenes/checkpoint.js)
  'clue-montage': ['any'],
  // a ride that is the leg's signature (a place's stretch with ride: true, the camel): the first teams on it, riding
  'ride': ['any'],
  // Don narrating the episode (director.js): the departure order, the flights, a bridge between the leaders and the
  // rest, the bottom of an elimination leg
  'don-narrate': ['welcome', 'depart', 'flight-wait', 'first-landed', 'flight-landed', 'flight-overtook', 'first-late', 'bridge', 'chill', 'last-stretch', 'overnight'],
  // the premiere: Don introduces every team as it turns up (director.js, leg one)
  'team-intro': ['any'],
};

const AGE = new Set(['kid', 'teen', 'adult', 'grown']);
const HARD = ['cruel', 'schemer', 'proud', 'tough', 'blunt', 'dry', 'bossy'];
const LEAD = { villain: ['cruel', 'schemer'], mastermind: ['schemer', 'calm'], schemer: ['schemer'], hothead: ['loud', 'blunt'],
  'challenge-beast': ['competitive'], hero: ['earnest', 'warm'], 'loyal-soldier': ['earnest'], 'social-butterfly': ['warm'],
  showmancer: ['flirty', 'warm'], underdog: ['earnest'], goat: ['ditzy'], 'chaos-agent': ['chaotic'], wildcard: ['chaotic'] };
const CAPPED = ['loud', 'odd'];

function byArchetype(tags, name) {
  const lead = (LEAD[players.find(p => p.name === name)?.archetype] || []).filter(t => tags.includes(t));
  return lead.length ? [...lead, ...tags.filter(t => !lead.includes(t))] : tags;
}

// The speaker's version of a turn: the relationship's line first (how siblings say it is not how exes
// do), then the speaker's strongest voice that has a variant, then the line as written. A variant heard
// this leg, or already said by this speaker this season, is passed over.
export function voicedLine(turn, speaker, { relFam = null, rng = Math.random, ledger = null, clock = 0, skip = null } = {}) {
  const base = turn.say || turn.conf;
  const v = turn.v;
  if (!v || !speaker) return { text: base, tag: null };
  const vday = ledger ? (ledger.vday ||= {}) : {}, vby = ledger ? (ledger.vby ||= {}) : {};
  const fresh = list => {
    const got = [list].flat().filter(Boolean);
    if (!got.length) return null;
    const start = Math.floor(rng() * got.length);
    const order = got.map((_, i) => got[(start + i) % got.length]);
    return order.find(x => vday[x] !== clock && !(vby[x] || []).includes(speaker)) || null;
  };
  const spend = x => { if (ledger) { vday[x] = clock; (vby[x] ||= []).push(speaker); } };
  if (relFam && v[`rel:${relFam}`]) {
    const x = fresh(v[`rel:${relFam}`]);
    if (x) { spend(x); return { text: x, tag: `rel:${relFam}` }; }
  }
  const tags = byArchetype(voiceOf(speaker), speaker);
  const hard = tags.some(t => HARD.includes(t));
  for (const t of tags) {
    if (hard && AGE.has(t)) continue;
    for (const key of [...new Set([t, FAMILY[t]].filter(Boolean))]) {
      if (skip && (skip.has(key) || skip.has(FAMILY[key]))) continue;
      // (the user, 2026-11-03: "they talk like bots, the english is super broken": the odd voice's surreal lines,
      // "The map was your child", "Our souls are finished", and the clipped ones, "Twice now. You.", "Feet. Sacred
      // table.", are not how a person talks. A voice says the line its own way only in whole sentences, about as full
      // as the line itself)
      if (key === 'odd') continue;
      const x = fresh([v[key]].flat().filter(c => fluent(c, base)));
      if (!x) continue;
      spend(x);
      return { text: x, tag: key };
    }
  }
  return { text: base, tag: null };
}

// a variant that says the whole line, in whole sentences: at least 70% of its words, and no sentence of under three
const wordsIn = s => String(s).replace(/\{[^}]+\}/g, 'X').split(/\s+/).filter(Boolean).length;
export function fluent(variant, base) {
  if (!variant) return false;
  if (wordsIn(variant) < wordsIn(base) * 0.7) return false;
  return (String(variant).match(/[^.!?]+[.!?]*/g) || []).map(x => x.trim()).filter(Boolean).every(x => wordsIn(x) >= 3 || /^(yes|no|okay|ok|right|fine|what|why|oh|wow|sure|good|great|thanks)\b/i.test(x));
}

const TOKEN = /\{(\w+)(?:\.(\w+))?\}/g;
// a team slot is the team talked about ("the Goths"); spoken to, it's the two of them ("Sorry, Alec and Spud.")
const TEAM_SLOTS = ['team', 'teamB', 'target'];
// Capitals for emphasis ("That TOWER! I didn't know it went up THAT far!", "LEFT, LEFT, RIGHT") read as a machine
// shouting (the user, 2026-11-03: "they dont talk human"): the words are said as words, the "!" carries the volume.
// (an abbreviation stays one: TV, OK)
const KEEP_CAPS = new Set(['TV', 'OK', 'DJ', 'UK', 'USA', 'GPS', 'ID', 'SOS', 'VIP', 'BBQ', 'CPR', 'ATM', 'DIY', 'LA', 'NYC', 'PE', 'BFF']);
export function calmCaps(s) {
  const out = String(s).replace(/\b[A-Z][A-Z']*[A-Z]\b/g, w => (KEEP_CAPS.has(w) ? w : w.toLowerCase()));
  return out.replace(/\bi\b/g, 'I').replace(/\bi'(m|ll|d|ve)\b/g, "I'$1")
    .replace(/(^|(?<!\.\.)[.!?]\s+|^\()([a-z])/g, (m, a, b) => a + b.toUpperCase());
}
export function fill(text, roles, slots) {
  let s = calmCaps(String(text));
  // "the Lawyers' case", not "the Lawyers's case"
  for (const k of TEAM_SLOTS) if (/s$/.test(slots[k] || '')) s = s.split(`{${k}}'s`).join(`{${k}}'`);
  return s.replace(TOKEN, (m, role, part, at, whole) => {
    let name = role === 'don' ? DON : roles[role] ?? slots[role];
    if (name == null) return m;
    if (!part && slots[`${role}Voc`] && TEAM_SLOTS.includes(role) && /^[,.!?]/.test(whole.slice(at + m.length))
      && /(^|[.!?,]\s+)$/.test(whole.slice(0, at))) name = slots[`${role}Voc`];
    let out = part ? pronouns(name)?.[part] ?? m : String(name);
    // "the Goths, Crimson and Ennui, go first": an aside in the name closes before the sentence goes on
    if (role === 'winners' && out.includes(', ') && /^ [a-z]/.test(whole.slice(at + m.length))) out += ',';
    return /(^|[.!?]\s+)$/.test(whole.slice(0, at)) ? out.charAt(0).toUpperCase() + out.slice(1) : out;
  });
}

const needCache = new WeakMap();
function needs(entry) {
  if (needCache.has(entry)) return needCache.get(entry);
  const n = new Set();
  for (const t of entry.turns || []) {
    if (t.opt) continue;
    if (t.by) n.add(t.by);
    for (const m of String(t.say || t.conf || t.beat || '').matchAll(TOKEN)) n.add(m[1]);
  }
  needCache.set(entry, n);
  return n;
}

// Facts that decide how a scene sounds, weighed four times an ordinary one: what caused it, the storyline it moves,
// and where it is: a place's own lines and a challenge's own lines win over the general ones when they fit.
export const STRONG = ['cause', 'threadStep', 'place', 'taskId'];
// ...and a place's or a challenge's own line, when one fits, always wins (it airs once a visit; the ledger stops repeats);
// so does Don's rule speech written for the twist he is explaining (the general ones are for a twist with none)
export const PREFER = ['place', 'taskId', 'rule'];
// the challenges that have their own lines (the director airs the challenge itself for them)
export const TASK_LINES = new Set(Object.values(POOLS).flatMap(l => l.map(e => e.when?.taskId)).filter(Boolean));

// Lines that talk as if the scene were at a task (they name the task or its judge): kept for scenes at a task.
const TASK_TALK = /\b(task|judge)\b/i;
const TASKY = new Set(Object.values(POOLS).flat().filter(e => e.turns.some(t => TASK_TALK.test([t.say, t.conf, t.beat].join(' ')))));
// kinds that are about a task whatever stretch they're filed under (Don explaining it, a team doing it)
// what a line needs a road vehicle for ("Left at the roundabout", "We'll split the cab", "the driver"): only where the
// team is in one (2026-11-03 read: a roundabout with five exits on the walk to the first tower, a cab deal inside it)
const VEHICLE_TALK = /\b(roundabouts?|taxis?|cabs?|bus|buses|the driver|our driver|drivers|steering wheel|petrol|gas station|parking (space|spot|lot)|park the car|the car\b|our car)\b/i;
const RIDING = new Set(['taxi', 'drive', 'bus', 'car', 'jeep', 'truck']);
const VETERAN_TALK = /\b(doing this (kind of thing )?(a lot )?longer than you|I've done this before|done this kind of thing|last time I was on (a show|television|TV))\b/i;
const MUST_WORDS = /^(don-|team-intro$|int-exit$|int-bleachers$|goodbye|farewell|.*-montage$|medevac|boomerang|task-|attempt-fail$|ride$)/;
const linesWith = re => new Set(Object.values(POOLS).flat().filter(e => e.turns.some(t => re.test([t.say, t.conf, t.beat].join(' ')))));
const YESTERDAY = linesWith(/\byesterday/i);
const MORNING = linesWith(/\b(good morning|rise and shine|first tip of the day|still yawning)\b/i);
const DAYLIGHT = linesWith(/\b(a hose|the market|market stall|shopkeeper|the shops?|caf[eé])\b/i);
// (the sun itself: not after dark, evening included: "It's a nice day" at twenty to nine at night, read 2026-11-03)
// (a place's own lines are written for it: only the general ones)
const OUTDOOR = new Set([...linesWith(/\b(fountain|the path|path narrows|ditch|swamp\w*|flooded|hedges?|puddles?|the field|the grass|the road|the trail|the bushes|a tree|the trees|the hill|mud|muddy|the river|the beach|the sand|the shade)\b/i)]
  .filter(e => !e.when?.taskId && !e.when?.place));
const SUNLIT = linesWith(/\b(nice day|lovely day|sunny|sunshine|sunburn\w*|in the heat|the midday|this sun)\b/i);
// (somebody watching a racer fall, slip or hang on by one hand: only at a challenge done with the body. "That's the
// third time they've fallen" aired at the tea picking, read 2026-11-03; a place's own lines say what their task is)
const FALLING = new Set([...linesWith(/\b(fell|fallen|falls over|falling off|slips|slipped|wobbles|hangs there|by one hand|use your feet)\b/i)]
  .filter(e => !e.when?.taskId && !e.when?.place));
const PHYSICAL = new Set(['heights', 'strength', 'water', 'nerve']);
const MANY_PLACES = linesWith(/\b(best|worst|favourite|favorite) (place|country|city|leg|challenge|food)( we've (been|had|done))? so far\b|\bplaces we've been\b|\bevery (place|country) we've\b|\bthe first night\b|\bfor (days|weeks)\b|\bdays of racing\b/i);
// the minute a scene happens, on the race's clock (the leg's start, js/rr/leg.js clockStart, plus the scene's own minute)
function minuteOf(state, scene) {
  const leg = scene.leg ?? scene.data?.snap?.leg ?? state.leg;
  const start = state.legs?.[leg - 1]?.clockStart ?? state.clock ?? 420;
  return start + (scene.data?.t ?? 0);
}
function todAt(state, scene) {
  const m = ((Math.round(minuteOf(state, scene)) % 1440) + 1440) % 1440;
  return m >= 1320 || m < 300 ? 'night' : m < 660 ? 'morning' : m < 1020 ? 'day' : 'evening';
}
// has a midnight passed since the last leg ended: in the rest before this one (js/rr/chill.js), or during this leg
function sinceMidnight(state, scene) {
  const leg = scene.leg ?? scene.data?.snap?.leg ?? state.leg;
  if (!(leg > 1)) return false;
  return !!state.legs?.[leg - 2]?.overnightAfter || minuteOf(state, scene) >= 1440;
}
const KNACK_TALK = /\b(doing it backwards|the wrong way round|start from the end|the pieces?|the knot|the pattern|the code|it's upside down|fold(ing|ed)? it|turn it (over|round))\b/i;
const KNACK = new Set(Object.values(POOLS).flat().filter(e => !e.when?.taskId && !e.when?.place && e.turns.some(t => KNACK_TALK.test([t.say, t.conf, t.beat].join(' ')))));
const VETERAN_CLAIM = new Set(Object.values(POOLS).flat().filter(e => e.turns.some(t => t.by === 'a' && VETERAN_TALK.test([t.say, t.conf].join(' ')))));
const VEHICULAR = new Set(Object.values(POOLS).flat().filter(e => e.turns.some(t => VEHICLE_TALK.test([t.say, t.conf, t.beat].join(' ')))));
export const KIND_AT_TASK = new Set(['task-stage', 'task-start', 'task-try', 'task-done', 'attempt-fail', 'quit-task', 'helped-botch', 'allin-alone',
  'whose-botch', 'watching-botch', 'decide-side', 'don-demo', 'don-rule', 'don-ruling', 'judge-yes', 'identity-moment']);
// the interviews that are about the moment before them: only a line written for that kind of moment will do
const ABOUT_INTERVIEWS = new Set(['int-feeling', 'int-strategy', 'int-about-team', 'int-contradict']);

// Endings the kind's general lines can't speak for (a check-in that never mentions the penalty): their own pool only.
export const OWN_ONLY = new Set(['don-place.penalty-reveal', 'don-place.penalty-served']);

function keyFor(kind, ending) {
  const own = `${kind}.${ending}`, any = `${kind}.any`;
  if (OWN_ONLY.has(own) && POOLS[own]) return own;
  if (ending !== 'any' && POOLS[own] && POOLS[any]) return [own, any];
  if (POOLS[own]) return own;
  return POOLS[any] ? any : null;
}

const ORDINAL = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
  'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth'];
const NUMBER = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen'];
// a penalty's length the way Don says it: 'an hour', 'half an hour', 'four hours', 'an hour and ten minutes'
export function penaltyWords(m) {
  const h = Math.floor(m / 60), r = m % 60;
  const hours = h === 1 ? 'an hour' : h ? `${NUMBER[h] || h} hours` : '';
  if (!r) return hours;
  if (r === 30 && !h) return 'half an hour';
  if (r === 30) return `${hours} and a half`;
  const mins = `${r === 15 ? 'fifteen' : r === 45 ? 'forty-five' : r === 20 ? 'twenty' : r === 10 ? 'ten' : NUMBER[r] || r} minutes`;
  return hours ? `${hours} and ${mins}` : mins;
}
const speakerName = (by, roles, slots) => (by === 'don' ? DON : by === 'local'
  ? (slots.local ? slots.local.charAt(0).toUpperCase() + slots.local.slice(1) : 'A local') : roles[by]);

/** Whether an interview about a moment has lines written for that kind of moment (the director rescues only one that
 * can be voiced): its pools hold an entry whose `cause` names the moment's kind. Other scenes: true. */
export function canVoice(state, scene) {
  if (!ABOUT_INTERVIEWS.has(scene.kind) || scene.data?.about == null) return true;
  const about = state.scenes.find(x => x.id === scene.data.about);
  const key = keyFor(scene.kind, scene.data?.ending ?? 'any');
  if (!about || !key) return false;
  return [].concat(key).some(k => (POOLS[k] || []).some(e => e.when?.cause != null && [].concat(e.when.cause).includes(about.kind)));
}

// The first hour of the race has no history yet (talk.js FRESH_MINUTES): a line that needs time behind it waits (the
// user's Home City transcript, 2026-10-21, at 07:00: "every SINGLE day of this RACE", "our cab broke down", "Nice of
// you to finally show up", "you're the ones who sang on the bus").
export const HISTORY = [/(?<!since )yesterday/i, /every (single )?day/i, /\b(an hour|hours|ages) ago\b/i, /for ages\b/i, /finally (show|turn)/i,
  /broke down/i, /\bthe bus\b|\bmost buses\b|\bwhole bus\b/i, /last (night|time|leg|week)\b/i, /we passed you/i, /all (week|race long)/i,
  /\b(so|miles) (far )?ahead\b/i, /\bagain\b.*\b(lost|wrong|late|last)\b/i, /been (wrong|right|lost|late) (all|every)/i,
  /money left/i, /every flight/i,
  // (2026-11-03 read, leg 1 at 07:00-07:30: "Did you two finally learn to read a map?", "You didn't have to wait for me
  // back there", "Is it true you two cried at the last check-in?", "the wrong bus this morning")
  /\bfinally\b/i, /\bback there\b/i, /\blast (check-in|mat|chill zone|challenge|stop)\b/i, /\bever since\b/i, /\bin the last (five|ten|twenty|few) minutes\b/i, /\bevery (tip|leg|challenge|mat|time)\b/i, /\bstill (here|trying)\b/i, /\bby now\b/i, /\bin your position\b/i, /\bon a plane home\b/i,
  /\bwe beat (you|them)\b/i, /\bkeep (calling|saying|asking|trying|looking)\b/i, /\ball race\b/i, /\bsince we started\b/i,
  // (2026-11-03 read, the first twenty minutes: "You know everybody's talking about you two", "You two look like you've
  // been crying" / "For twenty minutes?")
  /\beverybody'?s (been )?(talking|saying)\b/i, /\b(look|looks) like (you'?ve|they'?ve) been\b/i, /\bfor (twenty|thirty|forty) minutes\b/i];
// ...and on the first leg, at any hour, there is no earlier leg, no night on the road and no flight yet (seed 21's
// Home City read, 2026-10-21: "We haven't slept since leg two", "I carried you last leg like a backpack")
export const PAST_LEGS = [/last leg/i, /since leg/i, /\bleg (one|two|three|four|five)\b/i, /every leg/i, /the other legs/i,
  /(?<!since )yesterday/i, /last night/i, /every flight/i, /the camel/i,
  // (no plane yet on the first leg: "My legs are still asleep from the plane" at the foot of the first tower)
  /from the plane/i, /on the plane\b/i, /\bthe planes\b/i, /\bjet ?lag/i, /\bthe flight\b/i, /\bcountr(y|ies)\b/i];
const textsOf = entry => (entry.turns || []).flatMap(t => [t.say, t.conf, t.beat, ...Object.values(t.v || {}).flat()]).filter(x => typeof x === 'string');
const historyCache = new WeakMap(), pastCache = new WeakMap();
export function talksHistory(entry) {
  if (historyCache.has(entry)) return historyCache.get(entry);
  const hit = textsOf(entry).some(x => HISTORY.some(re => re.test(x)));
  historyCache.set(entry, hit);
  return hit;
}
export function talksPastLegs(entry) {
  if (pastCache.has(entry)) return pastCache.get(entry);
  const hit = textsOf(entry).some(x => PAST_LEGS.some(re => re.test(x)));
  pastCache.set(entry, hit);
  return hit;
}

/** { lines: [{ kind, by, text, voice }], lineId } or null when the kind has no pool (or no entry fits). */
export function writeScene(state, scene, { roles: given = null, keep = false } = {}) {
  const r = given || rolesOf(scene, state);
  if (!r) return null;
  // the finale's halfway mat has its own lines: nobody there has placed or is safe (lines/rewrite/finale-midmat.js)
  const key = scene.data?.midmat && POOLS[`${scene.kind}.midmat`] ? `${scene.kind}.midmat` : keyFor(scene.kind, r.ending ?? 'any');
  if (!key) return null;
  if (scene.data?.place != null && ORDINAL[scene.data.place]) r.slots.placing = ORDINAL[scene.data.place];
  if (scene.data?.place != null && NUMBER[scene.data.place]) r.slots.number = NUMBER[scene.data.place];
  if (scene.data?.minutes > 0) r.slots.penalty = penaltyWords(scene.data.minutes);
  const have = new Set([...Object.keys(r.roles), ...Object.keys(r.slots)]);
  const pools = {};
  const facts = factsFor(scene, r, state);
  // a line that talks as if it were at a task ("they go at the task twice as hard") plays only at one
  const tod = facts.tod ?? todAt(state, scene);
  const yesterdayOk = sinceMidnight(state, scene);
  // (an introduction is about who they are at home, their car, their mornings, their yesterday: none of the race's own
  // rules of place and time apply to it)
  const intro = scene.kind === 'team-intro';
  const placed = e => intro || !(facts.at && facts.at !== 'task' && !KIND_AT_TASK.has(scene.kind) && TASKY.has(e))
    && !(VEHICULAR.has(e) && !RIDING.has(facts.mode))
    // ("I've been doing this a lot longer than you" from somebody who has never been on a show)
    && !(VETERAN_CLAIM.has(e) && !facts.aVet)
    // (a general line about the knack of a task, "you're doing it backwards, start from the end", only where there's
    // something in their hands to get right: it aired on the tower's stairs, read 2026-11-03)
    && !(KNACK.has(e) && !facts.handsOn)
    // ("You said that yesterday" when the leg began the same evening the last one ended, "Good morning, racers!" at ten
    // to eight at night, and a woman with a hose in her garden at twenty to four in the morning: read 2026-11-03)
    && !(YESTERDAY.has(e) && !yesterdayOk)
    && !(MORNING.has(e) && tod !== 'morning')
    && !(DAYLIGHT.has(e) && tod === 'night')
    && !(SUNLIT.has(e) && (tod === 'night' || tod === 'evening'))
    && !(OUTDOOR.has(e) && facts.indoor)
    // ("Best place we've been so far?" with one place behind them: a comparison needs two, read 2026-11-03)
    && !(MANY_PLACES.has(e) && !((scene.leg ?? scene.data?.snap?.leg ?? state.leg) >= 3))
    && !(FALLING.has(e) && !facts.fearDoes && !(scene.data?.snap?.taskTypes || []).some(t => PHYSICAL.has(t)));
  // an interview about a moment is one written for that kind of moment, or there is no interview
  const aboutIt = e => !ABOUT_INTERVIEWS.has(scene.kind) || scene.data?.about == null || e.when?.cause != null;
  // (an opener whose setting isn't made yet waits for its plate: vp-rr-ep/opener-shots.js, the user 2026-10-20)
  const shot = e => scene.kind !== 'don-opener' || openerReady(e.id);
  // (an introduction is about the shows before this one: its "last time" is theirs)
  const early = e => scene.kind === 'team-intro' || ((!facts.fresh || !talksHistory(e)) && (!facts.firstLeg || !talksPastLegs(e)));
  for (const k of [].concat(key)) pools[k] = (POOLS[k] || []).filter(e => [...needs(e)].every(n => have.has(n)) && placed(e) && aboutIt(e) && shot(e) && early(e));
  // the premiere's introductions: the one the user wrote for a team airs; else a custom identity's own (written for any
  // name) over the relationship lines, which would never say what the team is
  if (scene.kind === 'team-intro') {
    const tier = facts.ownIntro ? 'ownIntro' : facts.custom ? 'custom' : null;
    if (tier) for (const k of Object.keys(pools)) { const mine = pools[k].filter(e => e.when?.[tier]); if (mine.length) pools[k] = mine; }
  }
  // an Either/Or's choice in its own words, the stairs or the deck, the lava or the falls (the user, 2026-10-22: "dont use
  // generic dialogue but specific per challenge"): where the challenge has lines of its own, only those
  if (scene.kind === 'decide-side' && facts.taskId) for (const k of Object.keys(pools)) {
    const mine = pools[k].filter(e => [].concat(e.when?.taskId ?? []).includes(facts.taskId));
    if (mine.length) pools[k] = mine;
  }
  state.lineLedger ||= newLedger();
  const clock = scene.leg ?? state.leg;
  // No exchange airs twice in one episode: when every line that fits has been heard this leg, a scene that can be cut is
  // (two teams at the tower said the same "The elevator does half the work for us" choice, and the BroSIS shut the
  // elevator on two teams in the same words, a minute apart: read 2026-11-03). Don, the introductions, the check-ins
  // and the montages always air.
  if (!keep && !MUST_WORDS.test(scene.kind)) {
    const day = state.lineLedger.day || {};
    const all = Object.values(pools).flat();
    if (all.length && all.every(e => day[e.id] === clock)) return { lines: [], lineId: null, repeat: true };
  }
  const speakers = Object.entries(r.roles).filter(([k]) => k !== 'don' && k !== 'local').map(([, n]) => n);
  const pairKey = [r.roles.a, r.roles.b].filter(Boolean).sort().join('|');
  const rng = stableRng(state.seed, 'rr-line', scene.id);
  // the premiere's introductions: a team's own identity (or, without one, its relationship) always wins over the
  // general lines, which are only for a team nothing else fits
  const prefer = scene.kind === 'team-intro' ? [...PREFER, 'identity', 'rel'] : PREFER;
  // (`fresh`: every line that fits airs once before any of them comes back this season, as Big Brother asks: two teams'
  // interviews were the same "How do we know each other? Long story." in one leg, read 2026-11-03)
  const entry = pickEntry(state.lineLedger, pools, key, facts, pairKey, rng, speakers, clock, { strong: STRONG, prefer, fresh: scene.kind !== 'team-intro' });
  if (!entry) return null;
  const relFam = scene.data?.snap?.relFam || null;
  const capped = {};
  const sceneCount = f => Object.values(capped).reduce((n, c) => n + (c[f] || 0), 0);
  const skipFor = by => new Set(CAPPED.filter(f => (capped[by]?.[f] || 0) >= 2 || sceneCount(f) >= 3));
  const here = t => !t.opt || [t.by, ...[...String(t.say || t.conf || t.beat || '').matchAll(TOKEN)].map(m => m[1])]
    .every(k => !k || have.has(k));
  const fits = t => !t.when || Object.entries(t.when).every(([k, v]) => (Array.isArray(v) ? v.includes(facts[k]) : facts[k] === v));
  const lines = [];
  entry.turns.forEach((t, i) => {
    if (!here(t) || !fits(t)) return;
    const kind = t.conf ? 'conf' : t.beat ? 'beat' : 'say';
    const by = t.by ? speakerName(t.by, r.roles, r.slots) : null;
    let said;
    if (kind === 'beat' || t.by === 'don' || t.by === 'local') said = { text: t.beat || t.say || t.conf, tag: null };
    // (a team's own line for a place on the mat is for the Chill Zone: the finale's halfway mat is nobody's first place)
    else if (t.id && !(scene.data?.midmat && String(t.id).startsWith('mat-')) && (said = identityLine(state, by, t.id, rng))) said = { text: said, tag: `id:${t.id}` };
    // a speaker's relationship lines are their own team's (c and d are the other team; in a romance the crush, b, and
    // b's partner d are; in a room, each speaker's own)
    else said = voicedLine(t, by, { relFam: SCENES[scene.kind]?.cast === 'group' || scene.kind === 'same-flight' ? relFamOfPerson(state, by)
      : (SCENES[scene.kind]?.family === 4 ? ['b', 'd'] : ['c', 'd']).includes(t.by) ? scene.data?.snap?.relFamB || null : relFam, rng,
      ledger: state.lineLedger, clock, skip: skipFor(by) });
    const fam = said.tag && (CAPPED.includes(said.tag) ? said.tag : FAMILY[said.tag]);
    if (CAPPED.includes(fam)) ((capped[by] ||= {})[fam] = (capped[by][fam] || 0) + 1);
    // an identity line names the speaker's own partner
    const slots = said.tag?.startsWith('id:') ? { ...r.slots, partner: partnerOf(state, by) } : r.slots;
    const line = { kind, by, text: fill(said.text, r.roles, slots), voice: said.tag };
    Object.defineProperty(line, 'turn', { value: `${entry.id}:${i}`, enumerable: false });
    lines.push(line);
  });
  // an identity's introduction can't know what the two of them are: one of them says it (lines/premiere-rel-tags.js)
  let relTagged = false;
  if (scene.kind === 'team-intro' && /^(pi|ci)\./.test(entry.id) && !entry.id.startsWith('ci.own') && lines.some(l => l.kind === 'conf')) {
    const t = state.teams[scene.data?.team];
    // an engaged couple (set in the Pairs view, or from their history) say that, not just that they're together
    const tags = t && (t.history?.engaged ? REL_TAGS.engaged : REL_TAGS[t.rel0 || t.rel] || ((t.feel0 || t.feel) === 'strained' ? FEEL_TAGS.strained : null));
    if (tags?.length) {
      const lastBy = [...lines].reverse().find(l => l.kind === 'conf')?.by;
      const who = lastBy === t.a ? t.b : t.a;
      // (one line per team: the next one not yet said in the premiere, from this team's own start in the list; two
      // couples saying "I'm winning us" in one episode was the bug, 2026-10-20)
      // (kept by scene: a scene written again says the same, and doesn't use up another team's line, 2026-10-22)
      const by = (state.relTagsBy ||= {});
      const used = Object.entries(by).filter(([k]) => k !== String(scene.id)).map(([, v]) => v);
      const from = Math.floor(stableRng(state.seed, 'rr-reltag', scene.id)() * tags.length) % tags.length;
      const text = by[scene.id] && tags.includes(by[scene.id]) ? by[scene.id]
        : tags.map((_, k) => tags[(from + k) % tags.length]).find(x => !used.includes(x)) || tags[from];
      by[scene.id] = text;
      lines.push({ kind: 'conf', by: who, text: fill(text, r.roles, { ...r.slots, partner: partnerOf(state, who) }), voice: null });
      relTagged = true;
    }
  }
  // a veteran says where they've been (lines/premiere-vet-tags.js, rr/past.js), whatever the team is: one line, after
  // the introduction, unless it already had a relationship line, or is the vets' own (it says they've done this) or the
  // user's own (their words, as they wrote them)
  const vt = scene.kind === 'team-intro' ? state.teams[scene.data?.team] : null;
  if (vt?.past && !relTagged && vt.rel !== 'reality-vets' && !entry.id.startsWith('ci.own') && !facts.ownIntro && lines.some(l => l.kind === 'conf')) {
    const vets = [vt.a, vt.b].filter(n => vt.past[n]);
    const lastBy = [...lines].reverse().find(l => l.kind === 'conf')?.by;
    const who = vets.find(n => n !== lastBy) || vets[0];
    const other = who === vt.a ? vt.b : vt.a;
    const me = vt.past[who], them = vt.past[other];
    const met = me && them ? metOn(me, them, other) : null;
    const key = met ? `met-${met}` : me.best || (them ? 'vet' : 'newbie');
    const tags = VET_TAGS[key] || VET_TAGS.vet;
    const by = (state.vetTagsBy ||= {});
    const used = Object.entries(by).filter(([k]) => k !== String(scene.id)).map(([, v]) => v);
    const from = Math.floor(stableRng(state.seed, 'rr-vettag', scene.id)() * tags.length) % tags.length;
    const text = by[scene.id] && tags.includes(by[scene.id]) ? by[scene.id]
      : tags.map((_, k) => tags[(from + k) % tags.length]).find(x => !used.includes(x)) || tags[from];
    by[scene.id] = text;
    const show = met ? showName(sharedSeason(me, them).format) : me.show;
    lines.push({ kind: 'conf', by: who, text: fill(text, r.roles, { ...r.slots, show, partner: other }), voice: null });
  }
  // the team's identity, heard at a natural moment (when the entry didn't already call one)
  if (!lines.some(l => String(l.voice || '').startsWith('id:'))) {
    // (the finale's halfway mat places nobody: no first-place or last-place line there)
    const hook = scene.data?.midmat && scene.kind === 'don-place' ? null : AUTO_HOOK[scene.kind]?.(facts);
    // at a challenge it opens the moment, said by whoever doesn't speak first: a task beat is a tight exchange that ends
    // on its button, and a line after the button answers nothing (2026-10-20 read: "Please don't. People walk on it." /
    // "This is a highlight run, Luis.")
    // (a celebration and an arrival are tight exchanges too: the identity line first, not after the joke that ends them,
    // "I finished a jigsaw once." / "This is the best I've felt all race...", read 2026-11-03)
    const opens = OPENS.has(scene.kind) || HOOK_FIRST.has(scene.kind);
    const partner = r.roles.b && partnerOf(state, r.roles.a) === r.roles.b ? r.roles.b : null;
    let who;
    if (opens) {
      const firstBy = lines.find(l => l.kind === 'say')?.by;
      who = firstBy === r.roles.a && partner ? partner : r.roles.a;
    } else {
      // elsewhere whoever didn't just speak says it (a, unless a had the last word; then a's partner)
      let end = lines.length;
      if (!scene.kind.startsWith('int-')) while (end > 0 && lines[end - 1].kind === 'conf') end--;
      const lastBy = lines.slice(0, end).reverse().find(l => l.kind !== 'beat')?.by;
      who = lastBy === r.roles.a && partner ? partner : r.roles.a;
    }
    if (hook && who && stableRng(state.seed, 'rr-idhook', scene.id)() < AUTO_SHARE) {
      const got = identityLine(state, who, hook, stableRng(state.seed, 'rr-idline', scene.id), { types: scene.data?.snap?.taskTypes });
      // (held to what the scene's own lines are held to: no history in the first hour, no earlier leg on the first one,
      // no car on foot)
      const said = got && !(facts.fresh && HISTORY.some(re => re.test(got))) && !(facts.firstLeg && PAST_LEGS.some(re => re.test(got)))
        && !(VEHICLE_TALK.test(got) && !RIDING.has(facts.mode)) ? got : null;
      // said in the scene: before the closing interview, if the scene ends on one; at a challenge, first of all (after
      // an action line it splits the action from the reaction to it)
      let at = lines.length;
      if (opens) at = 0;
      else if (!scene.kind.startsWith('int-')) while (at > 0 && lines[at - 1].kind === 'conf') at--;
      if (said && lines.length && (at > 0 || opens)) lines.splice(at, 0, { kind: scene.kind.startsWith('int-') ? 'conf' : 'say', by: who,
        text: fill(said, r.roles, { ...r.slots, partner: partnerOf(state, who) }), voice: `id:${hook}`, auto: true });
    }
  }
  // a challenge whose own local hands the clue out: the local says something first, as it changes hands (2026-10-22, the
  // user: "the local never said anything so why are they even there"); nobody is handed one reading over a shoulder
  if (HANDED.has(scene.kind) && scene.data?.ending !== 'read-over-shoulder') {
    const id = placeLocal(scene.data?.snap?.place, scene.data?.stretch);
    const text = id && handoverLine(id, scene.data?.ending, stableRng(state.seed, 'rr-handover', scene.id));
    if (text) lines.unshift({ kind: 'say', by: LOCALS[id], text, voice: `local:${id}` });
  }
  return { lines, lineId: entry.id };
}
const HANDED = new Set(['clue', 'box-grab']);

// Where a team's identity speaks on its own (identity.js hooks), and how often: at a task it's good or bad at,
// when a task keeps failing or is given up, on arriving somewhere new, first or last on the mat, going home,
// at a rival in trash talk, at a friend in good small talk.
const AUTO_SHARE = 0.6;
// the moments at a challenge, where the identity line opens the exchange instead of following it
const OPENS = new Set(['task-start', 'task-try', 'task-done', 'attempt-fail', 'task-stage']);
const HOOK_FIRST = new Set(['celebrate', 'arrival-awe']);
const AUTO_HOOK = {
  // after-fails is the try that finally worked: no struggle line over it. A 'bad' line reacts to a struggle ("this is
  // why"), so it isn't said at the start or over a first-try success (2026-10-20 read: "I skipped gym. This is why." at
  // the catfish before anyone had got wet); the struggling and failing moments have it
  'task-try': f => (f.ending === 'quit' ? 'quit' : f.ending === 'struggling' ? 'struggle' : f.ending === 'after-fails' ? null
    : f.idGood ? 'good' : null),
  'task-start': f => (f.idGood ? 'good' : null),
  // a try that just failed: the identity at the thing it's bad at
  'attempt-fail': f => (f.idBad ? 'bad' : null),
  'task-done': f => (f.ahead ? 'win' : null),
  'celebrate': f => (f.ending === 'gloat-at-others' ? null : 'win'),
  'arrival-awe': () => 'arrive',
  'don-place': f => (f.matPlace === 'first' ? 'mat-first' : f.matPlace === 'last' ? 'mat-last' : null),
  'int-exit': () => 'elim',
  // (not tacked onto a scene between two teams: "The Streamers keep trying to make me smile" after a row about a map,
  // "Tourists look at my jacket like it's going to bite them" after one about last place, read 2026-11-03: a line about
  // the other team that answers nothing anybody said)
};

function relFamOfPerson(state, n) {
  const t = Object.values(state.teams).find(x => x.a === n || x.b === n);
  return t ? relFamOf(t.rel) : null;
}

function partnerOf(state, n) {
  const t = Object.values(state.teams).find(x => x.a === n || x.b === n);
  return t ? (t.a === n ? t.b : t.a) : null;
}

export function transcript(lines) {
  return lines.map(l => (l.kind === 'beat' ? `(${l.text})` : l.kind === 'conf' ? `${l.by} [interview]: ${l.text}` : `${l.by}: ${l.text}`)).join('\n');
}
