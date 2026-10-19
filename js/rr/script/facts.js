// ══════════════════════════════════════════════════════════════════════
// rr/script/facts.js — what a line may know about its scene
// ══════════════════════════════════════════════════════════════════════
//
// A pool entry's `when` filters on these facts and nothing else; a test refuses any other key
// (manual §19.2 step 3). They come from the scene's own record and its snapshot, taken when it
// was played (scenes.js snapOf), plus what never changes (a team's identity, a person's voice):
// never live state, never a truth the speakers did not see.
import { identityOf } from '../identities.js';
import { voiceOf } from '../../td/story/voice.js';
import { players } from '../../core.js';
import { FAMILY } from '../../td/story/voice-family-map.js';

export const RR_FACT_KEYS = [
  'ending',
  // how far into the season
  'phase', 'early', 'late',
  // how the two stood: inside the team (band) and across two teams (bandX)
  'band', 'bandX', 'allied', 'rival', 'couple',
  // the team: its relationship, its family of relationship, its identity (and the other team's)
  'rel', 'relFam', 'identity', 'identityB',
  // the other team: its relationship, broke, failing at this stretch (0, 1, 'many'); a's team owes c's (a deal, a loan)
  'relB', 'relFamB', 'brokeB', 'failsB', 'weOwe',
  // the last sabotage done to a's team (push, ram, steal, kidnap-pet, course-sabotage, fake-shortcut, mind-game...);
  // a's team is the one that just arrived where the other team already was
  'sabKind', 'weArrived',
  // the task is one the identity is good at, or bad at
  'idGood', 'idBad',
  // where they think they are in the race; the money; a team not speaking
  'behind', 'ahead', 'broke', 'snapped',
  // the hour, as a word: night (22-5), morning (5-11), day (11-17), evening (17-22)
  'tod',
  // the stretch and how the task went; the task's main type (water, stomach, perform, heights...); how they travel
  'stretchKind', 'taskType', 'mode', 'fails', 'switched', 'quit', 'place',
  // at the mat: first, top (first third), mid, bottom (last third), last
  'matPlace',
  // why the system played it (a lead change: injury, snap, crush, win)
  'why',
  // what went wrong on the road (travel-mishap): flat-tyre, lost-driver, wrong-way
  'mishap',
  // the twist Don explains (don-rule): boomerang, yield, boomerang-vote; a team sent back because everybody picked it
  'rule', 'byVote',
  // an interview: a is the one the moment happened to (froze, got hurt, schemed); an exit: how the team went out
  // (last on the mat, on-location where Don found them, midpoint in the finale)
  'aDid', 'exitHow',
  // a is the older of the two by a generation (a parent, a grandparent): true / false; null when unknown
  'aElder',
  // the scene that caused this one (a chain, or the moment an interview is about), its ending, and the storyline step it moves
  'cause', 'causeEnding', 'threadStep',
  // how a talks, and how b talks: the voice family of their strongest tag (sharp, dry, loud, soft, odd)
  'register', 'registerB',
];

// who owes whom between the two teams: a deal records the team that helped; a loan or a repayment is the borrower's
function weOwe(scene, state) {
  const d = scene.data || {};
  if (['borrow', 'repay'].includes(scene.kind)) return true;
  if (!['deal', 'deal-broken'].includes(scene.kind) || !d.team || !d.other) return null;
  const deal = [...(state.deals || [])].reverse().find(x => (x.a === d.team && x.b === d.other) || (x.a === d.other && x.b === d.team));
  return deal ? deal.a === d.other : null;
}
const todWord = m => (m == null ? null : m >= 1320 || m < 300 ? 'night' : m < 660 ? 'morning' : m < 1020 ? 'day' : 'evening');
const ageOf = n => players.find(p => p.name === n)?.age ?? null;
// the team's elder: authored on the team (the Casting Room), else from the two ages, a generation apart
function elderOf(team) {
  if (!team) return null;
  if (team.elder) return team.elder;
  const x = ageOf(team.a), y = ageOf(team.b);
  if (x == null || y == null) return null;
  return x - y >= 15 ? team.a : y - x >= 15 ? team.b : null;
}
const registerOf = n => { const t = n ? voiceOf(n)[0] : null; return t ? FAMILY[t] || null : null; };

export function factsFor(scene, roles, state) {
  const d = scene.data || {};
  const s = d.snap || {};
  // a team's identity never changes; a custom one takes its strengths from the built-in it names (identities.js)
  const id = identityOf(state.teams[d.team]);
  const types = s.taskTypes || [];
  const cause = d.cause != null ? state.scenes.find(x => x.id === d.cause) : null;
  const thread = (d.threads || [])[0] || null;
  const f = {
    ending: d.ending ?? 'any',
    phase: s.phase ?? null, early: s.phase === 'early', late: s.phase === 'late',
    band: s.band ?? null, bandX: s.bandX ?? null, allied: !!s.allied, rival: (s.rivalry || 0) >= 2, couple: !!s.couple,
    rel: s.rel ?? null, relFam: s.relFam ?? null, relB: s.relB ?? null, relFamB: s.relFamB ?? null,
    brokeB: !!s.brokeB, sabKind: s.sabKind ?? null, weArrived: d.arriving != null ? d.arriving === d.team : null, failsB: !s.failsB ? 0 : s.failsB === 1 ? 1 : 'many', weOwe: weOwe(scene, state), identity: s.identity ?? null, identityB: s.identityB ?? null,
    idGood: !!(id && types.some(x => id.good.includes(x))), idBad: !!(id && types.some(x => id.bad.includes(x))),
    behind: s.rank != null && s.rank > 0.66, ahead: s.rank != null && s.rank < 0.33,
    broke: !!s.broke, snapped: !!s.snapped,
    tod: todWord(s.tod),
    stretchKind: s.stretchKind ?? null, taskType: types[0] ?? null, mode: s.mode ?? null,
    matPlace: d.matPlace ?? null, why: d.why ?? null, rule: d.rule ?? null, byVote: !!d.byVote,
    aDid: !!d.aDid, exitHow: d.exitHow ?? null, mishap: scene.kind === 'travel-mishap' ? d.kind ?? null : null,
    aElder: (() => { const e = elderOf(state.teams[d.team]); const a = roles?.roles?.a; return e && a ? e === a : null; })(),
    fails: !s.fails ? 0 : s.fails === 1 ? 1 : 'many',
    switched: !!(d.switched), quit: !!(d.quit), place: s.place ?? null,
    cause: cause ? cause.kind : null, causeEnding: cause ? cause.data?.ending ?? null : null,
    threadStep: thread ? thread.split(' ')[0] : null,
    register: registerOf(roles?.roles?.a), registerB: registerOf(roles?.roles?.b),
  };
  return f;
}

