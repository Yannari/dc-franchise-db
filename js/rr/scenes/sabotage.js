// Family 8 of the scene catalogue: sabotage and its aftermath (docs/ridonculous-race-scenes.md §8).
// Only for those who may scheme (CLAUDE.md archetype rules; scenes.js refuses a nice doer).
// Caught = another team present who sees it (intuition) or the crew (a quarter of the time):
// an hour's penalty (format.js PENALTIES.sabotage), recorded on the victim either way
// (`state.sabotaged`, read by the accusation and confront scenes). Witnessed or not decides
// who knows: an unseen sabotage is in the record of the doers only.
import { K, register } from './registry.js';
import { PENALTIES } from '../format.js';

const witnesses = c => (c.present || []).filter(id => id !== c.tid && id !== c.oid);
const catchChance = c => {
  const wit = witnesses(c);
  let miss = 0.75;
  for (const id of wit) miss *= 1 - c.S(c.state.lead[id], 'intuition') / 20;
  return 1 - miss;
};
const seenBy = (c, caught) => {
  const doers = [c.A, c.B];
  if (!caught) return doers;
  const wit = witnesses(c).flatMap(id => [c.state.teams[id].a, c.state.teams[id].b]);
  return [...doers, c.C, c.D, ...wit].filter(Boolean);
};
// The three endings every sabotage shares: it works unseen, it's seen, it backfires.
function sab({ delay, rivalry = 2, backfire = 10 }) {
  return {
    works: { w: c => 1 - catchChance(c), fx: (fx, c) => {
      fx.time(c.oid, delay); fx.rivalry(c.tid, c.oid, rivalry); fx.sabotaged(c.oid, c.tid, false); fx.pop(c.A, -1);
      c.state.rec[c.tid].sabotage++; c.seenBy = seenBy(c, false); } },
    seen: { w: c => catchChance(c), fx: (fx, c) => {
      fx.time(c.oid, Math.round(delay / 2)); fx.pending(c.tid, PENALTIES.sabotage); fx.rivalry(c.tid, c.oid, rivalry + 1);
      fx.sabotaged(c.oid, c.tid, true); fx.pop(c.A, -3);
      c.state.rec[c.tid].sabotage++; c.state.rec[c.tid].caught++; c.caught = true; c.seenBy = seenBy(c, true); } },
    backfires: { w: 0.2, fx: (fx, c) => { fx.time(c.tid, backfire); fx.rivalry(c.tid, c.oid, 1); c.state.rec[c.tid].sabotage++; c.seenBy = seenBy(c, false); } },
  };
}
// a close rival, never an ally (an ally is betrayed through alliance-betrayal, family 2)
const close = c => !c.allied() && (Math.abs(c.rank(c.tid) - c.rank(c.oid)) <= 0.25 || c.rivalry() >= 1);
const w = base => c => (close(c) ? base * c.S(c.A, 'strategic') / 10 : 0);
const facts = c => ({ caught: !!c.caught });
// a sabotage that's seen goes to Don (the catalogue's don-ruling: "try that again and you're out")
const ruled = { seen: 'don-ruling' };

register([
  K({ id: 'push', family: 8, cast: 'teams', scheme: true, moments: ['overlap'], when: w(0.05), endings: sab({ delay: 20 }), facts, next: ruled }),
  K({ id: 'ram', family: 8, cast: 'teams', scheme: true, moments: ['overlap'], when: c => (['drive', 'taxi'].includes(c.stretch?.mode) ? w(0.06)(c) : 0), endings: sab({ delay: 15, backfire: 15 }), facts, next: ruled }),
  K({ id: 'steal', family: 8, cast: 'teams', scheme: true, moments: ['overlap'], when: c => (c.stretch?.kind && c.stretch.kind !== 'travel' ? w(0.04)(c) : 0), endings: sab({ delay: 30 }), facts, next: ruled }),
  K({ id: 'kidnap-pet', family: 8, cast: 'teams', scheme: true, moments: ['overlap'], when: w(0.005), endings: sab({ delay: 60, rivalry: 3, backfire: 20 }), facts, next: ruled }),
  K({ id: 'course-sabotage', family: 8, cast: 'teams', scheme: true, moments: ['overlap'], when: w(0.03), endings: sab({ delay: 25 }), facts, next: ruled }),
  K({ id: 'fake-shortcut', family: 8, cast: 'teams', scheme: true, moments: ['overlap'], when: w(0.02), endings: sab({ delay: 40 }), facts, next: ruled }),
  K({ id: 'mind-game', family: 8, cast: 'teams', scheme: true, moments: ['overlap'], when: w(0.05), endings: {
    rattled: { w: c => (10 - c.S(c.C, 'temperament')) / 5, fx: (fx, c) => { fx.mind(c.C, 'stress', 15); fx.pass(c.oid, -0.1); fx.rivalry(c.tid, c.oid, 1); c.state.rec[c.tid].sabotage++; c.seenBy = [c.A, c.B, c.C, c.D]; } },
    'steels-them': { w: c => c.S(c.C, 'temperament') / 5, fx: (fx, c) => { fx.bond(c.C, c.D, 1); fx.rivalry(c.tid, c.oid, 1); c.state.rec[c.tid].sabotage++; c.seenBy = [c.A, c.B, c.C, c.D]; } },
  }, facts }),
  K({ id: 'admin-sabotage', family: 8, cast: 'teams', scheme: true, moments: ['airport'], when: w(0.1), endings: {
    'worse-seats': { w: c => c.S(c.A, 'social') / 4, fx: (fx, c) => { fx.mind(c.C, 'morale', -5); fx.rivalry(c.tid, c.oid, 1); c.state.rec[c.tid].sabotage++; } },
    'later-flight-attempt': { w: 1, fx: (fx, c) => { fx.time(c.tid, 10); fx.rivalry(c.tid, c.oid, 1); c.state.rec[c.tid].sabotage++; } },
  }, facts }),
  K({ id: 'free-ride', family: 8, cast: 'teams', scheme: true, moments: ['overlap'], when: c => ((c.state.attempts?.[c.oid]?.[c.stretch?.id]?.fails || 0) === 0 ? w(0.04)(c) : 0), endings: {
    used: { w: 1, fx: (fx, c) => { fx.time(c.tid, -10); c.state.rec[c.tid].sabotage++; } },
    'called-out': { w: c => c.S(c.C, 'intuition') / 5, fx: (fx, c) => { fx.rivalry(c.tid, c.oid, 1); fx.pop(c.A, -1); } },
  }, facts }),
  K({ id: 'revenge', family: 8, cast: 'teams', scheme: true, moments: ['overlap'], when: c => (c.state.sabotaged?.[c.tid]?.by === c.oid ? 0.3 : 0), endings: {
    'paid-back': { w: 1, fx: (fx, c) => { fx.time(c.oid, 20); fx.rivalry(c.tid, c.oid, 2); c.state.rec[c.tid].sabotage++; } },
    'takes-high-road': { w: c => c.S(c.A, 'loyalty') / 4, fx: (fx, c) => { fx.teams(c.tid, c.oid, 0.5); fx.pop(c.A, 2); } },
  }, facts }),
  K({ id: 'comeuppance', family: 8, cast: 'teams', moments: ['overlap', 'mat'], when: c => ((c.state.rec[c.tid]?.sabotage || 0) >= 2 ? 0.1 : 0), endings: {
    penalty: { w: 1, fx: (fx, c) => fx.pending(c.tid, 10) },
    'elimination-by-victims': { w: 0.3, fx: (fx, c) => { fx.time(c.tid, 20); fx.pop(c.A, -2); } },
  } }),
  K({ id: 'save-your-enemy', family: 8, cast: 'teams', moments: ['overlap'], when: c => (c.rivalry() >= 2 && (c.state.attempts?.[c.oid]?.[c.stretch?.id]?.fails || 0) >= 3 ? 0.1 : 0), endings: {
    saves: { w: 1, fx: (fx, c) => { fx.time(c.tid, 10); fx.time(c.oid, -15); fx.teams(c.tid, c.oid, 1); fx.rivalry(c.tid, c.oid, -1); fx.pop(c.A, 3); } },
    'walks-on': { w: 1, fx: (fx, c) => fx.rivalry(c.tid, c.oid, 1) },
  } }),
]);
