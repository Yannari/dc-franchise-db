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
import { FAMILY } from '../../td/story/voice-family-map.js';

export const RR_FACT_KEYS = [
  'ending',
  // how far into the season
  'phase', 'early', 'late',
  // how the two stood: inside the team (band) and across two teams (bandX)
  'band', 'bandX', 'allied', 'rival', 'couple',
  // the team: its relationship, its family of relationship, its identity (and the other team's)
  'rel', 'relFam', 'identity', 'identityB',
  // the task is one the identity is good at, or bad at
  'idGood', 'idBad',
  // where they think they are in the race; the money; a team not speaking
  'behind', 'ahead', 'broke', 'snapped',
  // the hour, as a word: night (22-5), morning (5-11), day (11-17), evening (17-22)
  'tod',
  // the stretch and how the task went
  'stretchKind', 'fails', 'switched', 'quit', 'place',
  // the scene that caused this one (a chain), and the storyline step it moves
  'cause', 'threadStep',
  // how a talks, and how b talks: the voice family of their strongest tag (sharp, dry, loud, soft, odd)
  'register', 'registerB',
];

const todWord = m => (m == null ? null : m >= 1320 || m < 300 ? 'night' : m < 660 ? 'morning' : m < 1020 ? 'day' : 'evening');
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
    rel: s.rel ?? null, relFam: s.relFam ?? null, identity: s.identity ?? null, identityB: s.identityB ?? null,
    idGood: !!(id && types.some(x => id.good.includes(x))), idBad: !!(id && types.some(x => id.bad.includes(x))),
    behind: s.rank != null && s.rank > 0.66, ahead: s.rank != null && s.rank < 0.33,
    broke: !!s.broke, snapped: !!s.snapped,
    tod: todWord(s.tod),
    stretchKind: s.stretchKind ?? null, fails: !s.fails ? 0 : s.fails === 1 ? 1 : 'many',
    switched: !!(d.switched), quit: !!(d.quit), place: s.place ?? null,
    cause: cause ? cause.kind : null,
    threadStep: thread ? thread.split(' ')[0] : null,
    register: registerOf(roles?.roles?.a), registerB: registerOf(roles?.roles?.b),
  };
  return f;
}

