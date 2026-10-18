// ══════════════════════════════════════════════════════════════════════
// rr/story/previously.js — "Previously on The Ridonculous Race", from what aired
// ══════════════════════════════════════════════════════════════════════
//
// Manual §19.2 step 8. Don recaps the last episode in three or four clauses: who went home, who
// won, and the moments that matter to the storylines the season follows. Only what aired (the last
// episode's segments), each clause naming its own subject the right way round.
import { SCENES } from '../scenes.js';
import { rolesOf, DON } from '../script/roles.js';
import { fill } from '../script/write.js';
import RECAP from '../script/lines/recap.js';

const SABOTAGE = new Set(Object.keys(SCENES).filter(k => SCENES[k].family === 8 && SCENES[k].scheme));
export const RECAP_KINDS = [...new Set(Object.keys(RECAP).map(k => k.split('.')[0]).flatMap(k => (k === 'sabotage' ? [...SABOTAGE] : [k])))];
const MAX = 4;

function clausesFor(sc) {
  const d = sc.data || {};
  const base = SABOTAGE.has(sc.kind) ? 'sabotage' : sc.kind;
  for (const k of [`${base}.${d.ending}`, `${base}.${d.matPlace}`, base]) if (RECAP[k]) return RECAP[k];
  return null;
}

// how much a moment matters to a recap
function rank(sc, followed) {
  if (sc.kind === 'don-elim' || sc.kind === 'don-arrives') return 100;
  if ((sc.data?.threadIds || []).some(id => followed.has(id))) return 60;
  if (sc.kind === 'don-place') return 40;
  return 30;
}

export function previouslyFor(state, prevEp, rng = Math.random) {
  if (!prevEp) return null;
  const byId = new Map(state.scenes.map(s => [s.id, s]));
  const followed = new Set(Object.keys(state.storyAired || {}));
  const cands = prevEp.segments.map(s => byId.get(s.scene)).filter(s => s && clausesFor(s) && rolesOf(s, state));
  if (!cands.length) return null;
  const picked = cands.sort((x, y) => rank(y, followed) - rank(x, followed) || x.id - y.id).slice(0, MAX)
    .sort((x, y) => (x.data?.t ?? 0) - (y.data?.t ?? 0) || x.id - y.id);
  const lines = [{ kind: 'say', by: DON, text: 'Previously on The Ridonculous Race...' }];
  const kept = [];
  for (const sc of picked) {
    const list = clausesFor(sc);
    const r = rolesOf(sc, state);
    const slots = { ...r.slots };
    const text = fill(list[Math.floor(rng() * list.length) % list.length], r.roles, slots);
    if (/\{\w+(\.\w+)?\}/.test(text)) continue;
    lines.push({ kind: 'say', by: DON, text });
    kept.push(sc);
  }
  if (!kept.length) return null;
  return { lines, scenes: kept.map(s => s.id), kinds: kept.map(s => s.kind) };
}

