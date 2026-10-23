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
import { liftFacts } from '../lift.js';
import { PLACES } from '../places.js';

export const RR_FACT_KEYS = [
  'ending',
  // how far into the season
  'phase', 'early', 'late',
  // the first hour of the race: nobody ahead or behind, nothing been through together yet; the first leg: no leg before
  'fresh', 'firstLeg',
  // how the two stood: inside the team (band) and across two teams (bandX)
  'band', 'bandX', 'allied', 'rival', 'couple',
  // the team: its relationship, its family of relationship, its identity (and the other team's)
  'rel', 'relFam', 'identity', 'identityB',
  // a custom identity (a name of the user's own: lines written for any name), ours or the other team's; a team whose
  // introduction the user wrote (the premiere airs theirs)
  'custom', 'customB', 'ownIntro',
  // a's team is already in an alliance the other team isn't in (a pitch is to join it)
  'bloc',
  // the team are an engaged couple (set in the Pairs view, or from their history; never the race's own proposal)
  'engaged',
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
  // what the challenge's scary part makes them do (fears.js: jump, drop, climb, rail, rope, cross, ride, swim, creature,
  // dark, fire, crowd, eat, any): a fear line names only the act it is for
  'fearDoes',
  // the challenge has something to eat (a stomach task) / a puzzle to work out (a brains task), whichever of its types
  // it is: a line about eating it or thinking it through plays only where there is one
  'eats', 'puzzle',
  // the leg has a sacred site (a temple, a tomb, the monk's wall: places/*.js `sacred`): a line about one plays only there
  'sacred',
  // the challenge itself (its stretch id: 'stew', 'spices'): a place's own lines for its own tasks
  'taskId',
  // the side a team took at an Either/Or ('stairs', 'skydeck', 'lava', 'falls'): a place's lines for each side
  'side',
  // where the scene is: 'task', 'airport' (airports and planes), 'mat', 'road' (anywhere in between)
  'at',
  // the leg's picking task (the spices): all five right, three or four, two or fewer
  'picked',
  // at the mat: first, top (first third), mid, bottom (last third), last
  'matPlace',
  // why the system played it (a lead change: injury, snap, crush, win)
  'why',
  // what went wrong on the road (travel-mishap): flat-tyre, lost-driver, wrong-way
  'mishap',
  // the twist Don explains (don-rule): boomerang, yield, boomerang-vote; a team sent back because everybody picked it
  'rule', 'byVote',
  // the stage of a staged challenge a moment is at (the sled's 'bear', the tango's 'routine')
  'stage',
  // an elevator (lift.js), as it went in the end: another team rode up with a's; a's waited for a car; a car left
  // without a's (full, shut on them, pushed out of it); two or more teams standing at its doors at the moment
  'liftWith', 'liftWaited', 'liftMissed', 'liftQueue',
  // a Blind Boomerang (the board doesn't say who threw it)
  'blind',
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
export function elderOf(team) {
  if (!team) return null;
  if (team.elder) return team.elder;
  const x = ageOf(team.a), y = ageOf(team.b);
  if (x == null || y == null) return null;
  return x - y >= 15 ? team.a : y - x >= 15 ? team.b : null;
}
const registerOf = n => { const t = n ? voiceOf(n)[0] : null; return t ? FAMILY[t] || null : null; };

// where a scene happens, from its stretch: a task, an airport or a plane, the mat, or the road between
const TASK_STRETCHES = ['allin', 'botch', 'either', 'superteam', 'route', 'midmat'];
function atOf(s, d) {
  if (TASK_STRETCHES.includes(s.stretchKind)) return 'task';
  if (s.stretchKind === 'mat' || d.stretch === 'mat') return 'mat';
  if (s.mode === 'flight' || /airport|plane|flight/.test(String(d.stretch || ''))) return 'airport';
  return s.stretchKind || d.stretch ? 'road' : null;
}

// how a picking task went (the spices: right picks out of five), in the words the pools gate on
export const pickedOf = n => (n == null ? null : n >= 5 ? 'right' : n >= 3 ? 'mostly' : 'wrong');

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
    bloc: !!s.bloc,
    engaged: !!state.teams[d.team]?.history?.engaged,
    custom: !!state.teams[d.team]?.custom?.name, customB: !!state.teams[d.other]?.custom?.name,
    ownIntro: !!(state.teams[d.team]?.lines?.introA && state.teams[d.team]?.lines?.introB),
    idGood: !!(id && types.some(x => id.good.includes(x))), idBad: !!(id && types.some(x => id.bad.includes(x))),
    fresh: !!s.fresh, firstLeg: s.leg === 1,
    behind: !s.fresh && s.rank != null && s.rank > 0.66, ahead: !s.fresh && s.rank != null && s.rank < 0.33,
    broke: !!s.broke, snapped: !!s.snapped,
    tod: todWord(s.tod),
    stretchKind: s.stretchKind ?? null, taskType: types[0] ?? null, mode: s.mode ?? null, fearDoes: s.fearDoes ?? null, eats: types.includes('stomach') && !s.noEat, puzzle: types.includes('brains'),
    sacred: !!PLACES[s.place]?.sacred,
    side: s.side ?? null,
    at: atOf(s, d),
    matPlace: d.matPlace ?? null, why: d.why ?? null, rule: d.rule ?? null, byVote: !!d.byVote, stage: d.stage ?? null, blind: !!d.blind,
    aDid: !!d.aDid, exitHow: d.exitHow ?? null, mishap: scene.kind === 'travel-mishap' ? d.kind ?? null : null,
    aElder: (() => { const e = elderOf(state.teams[d.team]); const a = roles?.roles?.a; return e && a ? e === a : null; })(),
    fails: !s.fails ? 0 : s.fails === 1 ? 1 : 'many',
    switched: !!(d.switched), quit: !!(d.quit), place: s.place ?? null, taskId: d.stretch ?? null,
    picked: pickedOf(s.picked),
    cause: cause ? cause.kind : null, causeEnding: cause ? cause.data?.ending ?? null : null,
    threadStep: thread ? thread.split(' ')[0] : null,
    register: registerOf(roles?.roles?.a), registerB: registerOf(roles?.roles?.b),
    liftWith: null, liftWaited: null, liftMissed: null, liftQueue: false,
    ...(d.team && d.stretch ? liftFacts(state, scene.leg ?? s.leg, d.stretch, d.team, d.t) : {}),
  };
  return f;
}

