// ══════════════════════════════════════════════════════════════════════
// rr/story/previously.js — "Previously on The Ridonculous Race", from what aired
// ══════════════════════════════════════════════════════════════════════
//
// Manual §19.2 step 8. Don tells last episode as one short story over the clips (the user, 2026-10-18:
// "this can't be how Don is doing his recap" — it was four disconnected one-liners):
//   1. where the teams were ("Previously on The Ridonculous Race, the teams took on the Red Sand Desert.")
//   2. two or three moments that aired, in order, named by who did them and joined up ("Meanwhile, ...")
//   3. one line for the result: who took the leg and who went home (or that nobody did)
//   4. a tease ("... Find out right now, on The Ridonculous Race!")
// A team is named the way a host says it: "the Goths" for an identity team, "Alec and Spud" for the rest.
import { SCENES } from '../scenes.js';
import { IDENTITIES } from '../identities.js';
import { rolesOf, DON } from '../script/roles.js';
import { fill } from '../script/write.js';
import RECAP from '../script/lines/recap.js';

const SABOTAGE = new Set(Object.keys(SCENES).filter(k => SCENES[k].family === 8 && SCENES[k].scheme));
const RESULT = ['don-place', 'don-elim', 'don-arrives', 'don-fakeout'];
const FRAME = new Set(['open', 'open.first', 'result', 'result.on-location', 'result.non-elim', 'tease']);
export const RECAP_KINDS = [...new Set([...RESULT, ...Object.keys(RECAP).filter(k => !FRAME.has(k)).map(k => k.split('.')[0])
  .flatMap(k => (k === 'sabotage' ? [...SABOTAGE] : [k]))])];
const BEATS = 3;
const JOIN = ['Meanwhile, ', 'And '];

// "the Goths" for a team named by its identity, "Alec and Spud" for a team named by its people
export function teamRef(state, id) {
  const t = state.teams[id];
  if (!t) return null;
  if (t.identity && IDENTITIES[t.identity]?.name === t.name) return `the ${t.name}`;
  return t.name.replace(/ & /g, ' and ');
}

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
  'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen'];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const pick = (list, rng) => list[Math.floor(rng() * list.length) % list.length];

function clausesFor(sc) {
  const d = sc.data || {};
  const base = SABOTAGE.has(sc.kind) ? 'sabotage' : sc.kind;
  for (const k of [`${base}.${d.ending}`, base]) if (RECAP[k] && !FRAME.has(k)) return RECAP[k];
  return null;
}

// how much a moment matters to a recap: the storylines the season follows first
const rank = (sc, followed) => ((sc.data?.threadIds || []).some(id => followed.has(id)) ? 60 : 30);

export function previouslyFor(state, prevEp, rng = Math.random) {
  if (!prevEp) return null;
  const byId = new Map(state.scenes.map(s => [s.id, s]));
  const followed = new Set(Object.keys(state.storyAired || {}));
  const aired = prevEp.segments.map(s => byId.get(s.scene)).filter(Boolean);
  const say = text => ({ kind: 'say', by: DON, text: cap(text) });
  const kept = [];

  // 1. where they were
  const lines = [say(fill(pick(RECAP[prevEp.n === 1 && RECAP['open.first'] ? 'open.first' : 'open'], rng), {},
    { place: prevEp.placeName || 'the last stop', count: WORDS[prevEp.teams] || String(prevEp.teams ?? '') }))];

  // 2. the moments, in the order they happened, one clause per kind of moment per team
  const seenKey = new Set();
  const beats = aired.filter(s => !RESULT.includes(s.kind) && clausesFor(s) && rolesOf(s, state))
    .sort((x, y) => rank(y, followed) - rank(x, followed) || x.id - y.id)
    .filter(s => {
      // one moment of each kind: three sabotages in a row is a list, not a story
      const k = SABOTAGE.has(s.kind) || SCENES[s.kind]?.family === 8 ? 'sabotage' : s.kind;
      if (seenKey.has(k)) return false;
      seenKey.add(k);
      return true;
    })
    .slice(0, BEATS)
    .sort((x, y) => (x.data?.t ?? 0) - (y.data?.t ?? 0) || x.id - y.id);
  for (const sc of beats) {
    const r = rolesOf(sc, state);
    const slots = { ...r.slots };
    if (sc.data?.team) slots.team = teamRef(state, sc.data.team);
    if (sc.data?.other) slots.teamB = teamRef(state, sc.data.other);
    if (sc.data?.target) slots.target = teamRef(state, sc.data.target) || slots.target;
    let text = fill(pick(clausesFor(sc), rng), r.roles, slots);
    if (/\{\w+(\.\w+)?\}/.test(text)) continue;
    // the second and third moments join the first ("Meanwhile, the Goths...")
    if (kept.length) text = JOIN[(kept.length - 1) % JOIN.length] + text.replace(/^The /, 'the ');
    lines.push(say(text));
    kept.push(sc);
  }

  // 3. the result: who took the leg, and who went home (or that nobody did)
  const winner = prevEp.order?.[0];
  const out = prevEp.eliminated?.[0];
  const how = out ? (prevEp.how?.[out] === 'on-location' ? 'result.on-location' : 'result') : 'result.non-elim';
  const last = out || prevEp.order?.at(-1);
  if (winner && RECAP[how]) {
    lines.push(say(fill(pick(RECAP[how], rng), {}, { winner: teamRef(state, winner), out: teamRef(state, out), last: teamRef(state, last) })));
    for (const s of aired) if ((s.kind === 'don-place' && s.data?.team === winner) || (RESULT.includes(s.kind) && s.kind !== 'don-place' && s.data?.team === last)) kept.push(s);
  }

  // 4. the tease
  lines.push(say(pick(RECAP.tease, rng)));
  if (lines.length < 3) return null;
  return { lines, scenes: kept.map(s => s.id), kinds: kept.map(s => s.kind) };
}
