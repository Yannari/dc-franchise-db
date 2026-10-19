// ══════════════════════════════════════════════════════════════════════
// rr/story/previously.js — "Last time on The Ridonculous Race", from what aired
// ══════════════════════════════════════════════════════════════════════
//
// Manual §19.2 step 8, in the shape the real show uses (episode 3, the user's goal transcript, 2026-10-18):
//   "Last time on The Ridonculous Race, after shopping for spices and cameling through the desert, our teams
//    built up a hearty appetite. And I lost mine. The winners were best friends Carrie and Devin. In my book,
//    everyone else was a loser, but we could only eliminate one team, and last week it was the LARPers. I'm not
//    sad. But that was then, and this is The Ridonculous Race!"
// So: the leg in one line (the place's `recap`, or its name) with Don's own gag; at most one storyline moment that
// matters (a betrayal, a break-up); the winners named the way the show names them ("best friends Carrie and
// Devin", "the Goths, Crimson and Ennui"); who went home, with a dig; "But that was then...".
// On television each of Don's lines plays over the footage, so after each one the recap replays a clip: a line or two
// of what was really said in that moment last time, word for word (`clip: true`). The leg's line gets a clip from
// its challenges (somebody kicked by an emu, somebody swimming past a mine).
import { SCENES } from '../scenes.js';
import { IDENTITIES } from '../identities.js';
import { getPlace } from '../places.js';
import { pronouns } from '../../players.js';
import { rolesOf, DON, teamRef } from '../script/roles.js';
import { fill } from '../script/write.js';
import { elderOf } from '../script/facts.js';
import RECAP from '../script/lines/recap.js';
import RECAP_AT from '../script/lines/recap-places.js';

const SABOTAGE = new Set(Object.keys(SCENES).filter(k => SCENES[k].family === 8 && SCENES[k].scheme));
const RESULT = ['don-place', 'don-elim', 'don-arrives', 'don-fakeout'];
const FRAME = new Set(['open', 'winners', 'exit', 'exit.on-location', 'exit.non-elim']);
// the storyline moments big enough to make the recap (the show recaps the leg, not every row)
const BIG = new Set(['alliance-betrayal', 'breakup', 'back-together', 'confession', 'medevac-choice', 'quit-talk',
  'save-your-enemy', 'boomerang-decide', 'near-kiss', 'injury', 'deal-broken', 'accusation', 'old-wound', 'blame', 'snap']);
export const RECAP_KINDS = [...new Set([...RESULT, ...Object.keys(RECAP).filter(k => !FRAME.has(k)).map(k => k.split('.')[0])
  .flatMap(k => (k === 'sabotage' ? [...SABOTAGE] : [k]))])];
export const CLOSE = 'But that was then, and this is The Ridonculous Race!';

export { teamRef };

// what the two of them are to each other, the way a host introduces them
const REL_TAG = { cousins: 'cousins', married: 'married couple', dating: 'couple', 'newly-dating': 'brand-new couple',
  'on-off': 'on-again, off-again couple', exes: 'exes', 'once-engaged': 'former fiancés', bffs: 'best friends',
  coworkers: 'coworkers', roommates: 'roommates', rivals: 'rivals', enemies: 'sworn enemies', 'reality-vets': 'reality TV veterans' };
const he = n => pronouns(n)?.sub;
function relTag(t) {
  const [x, y] = [t.a, t.b];
  if (t.rel === 'siblings') {
    const g = [he(x), he(y)];
    return g.every(s => s === 'he') ? 'brothers' : g.every(s => s === 'she') ? 'sisters' : g.includes('he') && g.includes('she') ? 'brother and sister' : 'siblings';
  }
  if (t.rel === 'parent-child' || t.rel === 'grandparent-grandchild') {
    const old = elderOf(t) || x, kid = old === x ? y : x;
    const up = t.rel === 'parent-child' ? { he: 'father', she: 'mother' } : { he: 'grandpa', she: 'grandma' };
    const down = t.rel === 'parent-child' ? { he: 'son', she: 'daughter' } : { he: 'grandson', she: 'granddaughter' };
    const a = up[he(old)], b = down[he(kid)];
    return a && b ? `${a} and ${b}` : t.rel === 'parent-child' ? 'parent and kid' : 'grandparent and grandkid';
  }
  return REL_TAG[t.rel] || 'partners';
}

// "best friends Carrie and Devin", "the Goths, Crimson and Ennui"
export function teamTag(state, id) {
  const t = state.teams[id];
  if (!t) return null;
  if (t.identity && IDENTITIES[t.identity]?.name === t.name) return `the ${t.name}, ${t.a} and ${t.b}`;
  return `${relTag(t)} ${t.a} and ${t.b}`;
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

// the moments of a challenge worth replaying behind the leg's line
const TASK_CLIP = new Set(['task-try', 'attempt-fail', 'ride', 'travel-mishap', 'gross-out', 'phobia', 'fear-through', 'whose-botch',
  'watching-botch', 'celebrate']);
// a clip: the two lines of a scene that play best out of it (short, said with feeling), as they aired
function clipOf(ep, sceneId, max = 2) {
  const seg = ep.segments.find(x => x.scene === sceneId);
  const said = (seg?.lines || []).filter(l => l.kind === 'say' || l.kind === 'conf');
  if (!said.length) return [];
  const score = (l, i) => (l.text.length <= 110 ? 2 : 0) + (/!/.test(l.text) ? 2 : /\?/.test(l.text) ? 1 : 0) + i / said.length;
  let best = 0, bestScore = -1;
  for (let i = 0; i + Math.min(max, said.length) <= said.length; i++) {
    const sc = said.slice(i, i + max).reduce((a, l, k) => a + score(l, i + k), 0);
    if (sc >= bestScore) { best = i; bestScore = sc; }
  }
  // each clip carries the scene it came from, so the viewer replays it on that scene's own plate
  return said.slice(best, best + max).map(l => ({ kind: l.kind, by: l.by, text: l.text, clip: true, scene: sceneId }));
}
const pick = (list, rng) => list[Math.floor(rng() * list.length) % list.length];

function clausesFor(sc) {
  const d = sc.data || {};
  const base = SABOTAGE.has(sc.kind) ? 'sabotage' : sc.kind;
  for (const k of [`${base}.${d.ending}`, base]) if (RECAP[k] && !FRAME.has(k)) return RECAP[k];
  return null;
}

export function previouslyFor(state, prevEp, rng = Math.random) {
  if (!prevEp) return null;
  const byId = new Map(state.scenes.map(s => [s.id, s]));
  const followed = new Set(Object.keys(state.storyAired || {}));
  const aired = prevEp.segments.map(s => byId.get(s.scene)).filter(Boolean);
  const say = text => ({ kind: 'say', by: DON, text: cap(text) });
  const kept = [];
  const place = getPlace(prevEp.place);

  // 1. the leg in a line, and Don's gag
  // the place's own gag when it has some, most of the time
  const opens = RECAP_AT[prevEp.place] && rng() < 0.7 ? RECAP_AT[prevEp.place] : RECAP.open;
  const lines = [say(fill(pick(opens, rng), {}, { summary: place?.recap || `racing through ${prevEp.placeName || 'the last stop'}` }))];
  const clips = [];
  const replay = (id, max) => { const c = clipOf(prevEp, id, max); if (c.length) { lines.push(...c); clips.push(id); } };
  //    ...over a moment from its challenges, the liveliest of a few
  const bangs = x => (x.lines || []).filter(l => l.kind === 'say' && /!/.test(l.text)).length;
  const tasky = prevEp.segments.filter(x => x.scene != null && TASK_CLIP.has(x.kind) && bangs(x) >= 2).sort((x, y) => bangs(y) - bangs(x));
  if (tasky.length) replay(pick(tasky.slice(0, 4), rng).scene, 2);

  // 2. at most one storyline moment, the biggest the season is following
  const follows = s => (s.data?.threadIds || []).some(id => followed.has(id));
  const big = aired.filter(s => BIG.has(s.kind) && clausesFor(s) && rolesOf(s, state))
    .sort((x, y) => follows(y) - follows(x) || x.id - y.id)[0];
  if (big) {
    const r = rolesOf(big, state);
    const slots = { ...r.slots };
    if (big.data?.team) slots.team = teamRef(state, big.data.team);
    if (big.data?.other) slots.teamB = teamRef(state, big.data.other);
    if (big.data?.target) slots.target = teamRef(state, big.data.target) || slots.target;
    const text = fill(pick(clausesFor(big), rng), r.roles, slots);
    if (!/\{\w+(\.\w+)?\}/.test(text)) { lines.push(say(text)); kept.push(big); replay(big.id, 2); }
  }

  // 3. the winners, the way the show names them
  const winner = prevEp.order?.[0];
  if (winner) {
    lines.push(say(fill(pick(RECAP.winners, rng), {}, { winners: teamTag(state, winner) })));
    const w = aired.find(s => s.kind === 'don-place' && s.data?.team === winner);
    if (w) { kept.push(w); replay(w.id, 2); }
  }

  // 4. who went home (or that nobody did), with a dig
  const out = prevEp.eliminated?.[0];
  const last = out || prevEp.order?.at(-1);
  const key = out ? (prevEp.how?.[out] === 'on-location' ? 'exit.on-location' : 'exit') : 'exit.non-elim';
  if (last && RECAP[key]) {
    lines.push(say(fill(pick(RECAP[key], rng), {}, { out: teamRef(state, last), last: teamRef(state, last) })));
    const x = aired.find(s => RESULT.includes(s.kind) && s.kind !== 'don-place' && s.data?.team === last);
    if (x) kept.push(x);
    // the goodbye: their exit interview if it aired, or the moment Don told them
    const bye = aired.find(s => s.kind === 'int-exit' && s.data?.team === last) || x;
    if (bye) replay(bye.id, 2);
  }

  // 5. "But that was then..."
  lines.push(say(CLOSE));
  return { lines, scenes: kept.map(s => s.id), kinds: kept.map(s => s.kind), clips };
}
