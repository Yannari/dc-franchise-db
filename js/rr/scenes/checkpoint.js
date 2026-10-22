// The checkpoint at every challenge (2026-10-21, the user: "the don box are here for a reason its a checkpoint use
// them"). Each team reaching a challenge takes its clue there (from the Don Box, or the local who hands it out: the
// viewer shows which) and reads it; at an Either/Or it decides there (decide-side, partners.js, played with it:
// talk.js talkAtCheckpoint). It is a moment of the race, not only a doorway: the envelopes left in the box say where a
// team stands, a clue misread costs time, and two teams at the box at once can grab, give way, or read over a shoulder.
import { K, register } from './registry.js';

const both = (fx, c, key, d) => { fx.mind(c.A, key, d); fx.mind(c.B, key, d); };

register([
  K({ id: 'clue', family: 1, moments: ['clue'], endings: {
    read: { w: 3, fx: (fx, c) => fx.mind(c.lead, 'morale', 1) },
    // (a lead who doesn't take it in: back the wrong way, then back again)
    misread: { w: c => (10 - c.S(c.lead, 'mental')) * 0.12, fx: (fx, c) => { fx.time(c.tid, 12); fx.mind(c.lead, 'stress', 5); } },
    // (the box still full, or nearly empty: the place they're in, without anybody telling them)
    'count-ahead': { w: c => (c.event?.box === 'ahead' ? 2 : 0), fx: (fx, c) => { both(fx, c, 'morale', 4); fx.believe([c.A, c.B], { about: 'rank', claim: 'ahead', value: c.event?.left ?? null }); } },
    'count-behind': { w: c => (c.event?.box === 'behind' ? 2 : 0), fx: (fx, c) => { both(fx, c, 'stress', 6); fx.believe([c.A, c.B], { about: 'rank', claim: 'behind', value: c.event?.left ?? null }); } },
  } }),
  // two teams at the box in the same minute (a and b the team that acts, c and d the other)
  K({ id: 'box-grab', family: 2, cast: 'teams', moments: ['box'], when: c => (c.rivalry() >= 1 ? 0.7 : 0.25), endings: {
    snatched: { w: c => c.S(c.A, 'boldness') / 5, fx: (fx, c) => { fx.rivalry(c.tid, c.oid, 1); fx.time(c.oid, 2); fx.pop(c.A, -1); } },
    'after-you': { w: c => c.S(c.A, 'social') / 6 + Math.max(0, c.teamBond()) / 4, fx: (fx, c) => { fx.teams(c.tid, c.oid, 0.6); fx.pop(c.A, 1); } },
    'read-over-shoulder': { w: c => c.S(c.A, 'intuition') / 8, fx: (fx, c) => { fx.rivalry(c.tid, c.oid, 1); fx.believe([c.A, c.B], { about: 'side', claim: 'watched', value: c.stretch?.id }); } },
  } }),
]);
