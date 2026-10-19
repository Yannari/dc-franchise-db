// Family 1 of the scene catalogue: the partners, at every stretch
// (docs/ridonculous-race-scenes.md §1). The bulk of the show: what the two say while
// they do the race. Moments: tip, either, botch-pick, travel, fare, plane, wait, quiet,
// fail, pass, fear, botch-watch, mat, and the emitted ones (snap, makeup, lead,
// reward, separate).
import { K, register } from './registry.js';

const both = (fx, c, key, d) => { fx.mind(c.A, key, d); fx.mind(c.B, key, d); };
const other = c => (c.lead === c.A ? c.B : c.A);
const types = c => c.stretch?.types || (c.stretch?.sides || []).flatMap(s => s.types) || [];
const has = (c, ...t) => types(c).some(x => t.includes(x));
const DATING = ['dating', 'newly-dating', 'on-off', 'married', 'once-engaged'];
// the secret has been told (threads.js closed it): it rarely comes back
const secretOut = c => (c.state.threads || []).some(t => t.thread === 'secret' && t.closed && t.closed !== 'gone' && t.who.includes(c.A));

register([
  // A couple proposes on the mat after a win (chill.js proposalCheck). A is the one asking.
  K({ id: 'proposal', family: 1, moments: ['proposal'], endings: {
    yes: { w: c => 1 + Math.max(0, c.bond(c.A, c.B)) / 2, fx: (fx, c) => { fx.bond(c.A, c.B, 2); both(fx, c, 'morale', 10); fx.note(`engaged:${c.tid}`, c.state.leg); } },
    'not-yet': { w: c => (c.bond(c.A, c.B) < 5 ? 1 : 0.25), fx: (fx, c) => { fx.bond(c.A, c.B, -1.5); fx.mind(c.A, 'morale', -10); fx.mind(c.B, 'stress', 5); } },
  } }),
  K({ id: 'tip-read', family: 1, moments: ['tip'], endings: {
    clear: { w: c => c.S(c.lead, 'mental'), fx: (fx, c) => fx.mind(c.lead, 'morale', 1) },
    puzzled: { w: c => 10 - c.S(c.lead, 'mental'), fx: (fx, c) => fx.time(c.tid, 6) },
    misread: { w: c => (10 - c.S(c.lead, 'mental')) * 0.3, fx: (fx, c) => { fx.time(c.tid, 20); fx.mind(c.lead, 'stress', 5); } },
  } }),
  K({ id: 'decide-side', family: 1, moments: ['either'], endings: {
    agree: { w: c => 1 + Math.max(0, c.bond(c.A, c.B)) / 3, fx: (fx, c) => fx.bond(c.A, c.B, 0.3) },
    overruled: { w: c => c.S(c.lead, 'boldness') / 5, fx: (fx, c) => { fx.bond(c.A, c.B, -0.5); fx.mind(other(c), 'morale', -3); } },
    compromise: { w: 0.6, fx: (fx, c) => { fx.bond(c.A, c.B, 0.2); fx.time(c.tid, 3); } },
    'swayed-by-watching': { w: c => ((c.present || []).length > 1 ? 1.2 : 0.1), fx: (fx, c) => { fx.believe([c.A, c.B], { about: 'side', claim: 'watched', value: c.stretch?.id }); fx.mind(c.lead, 'stress', -2); } },
  } }),
  K({ id: 'whose-botch', family: 1, moments: ['botch-pick'], endings: {
    obvious: { w: 2, fx: (fx, c) => fx.bond(c.A, c.B, 0.2) },
    volunteer: { w: c => c.S(c.A, 'boldness') / 5, fx: (fx, c) => fx.mind(c.A, 'morale', 3) },
    pushed: { w: c => Math.max(0.1, 1 - c.bond(c.A, c.B) / 5), fx: (fx, c) => { fx.bond(c.A, c.B, -0.5); fx.mind(other(c), 'stress', 5); } },
    'teaser-guess': { w: 0.8, fx: (fx, c) => { fx.believe([c.A, c.B], { about: 'task', claim: 'guess', value: c.stretch?.teaser || null }); fx.mind(c.lead, 'morale', 1); } },
  } }),
  K({ id: 'which-way', family: 1, moments: ['travel'], when: c => (['foot', 'drive', 'taxi'].includes(c.stretch?.mode) ? 1 : 0), endings: {
    right: { w: c => c.S(c.lead, 'intuition'), fx: (fx, c) => fx.mind(c.lead, 'morale', 1) },
    'argue-right': { w: c => Math.max(0.2, 5 - c.bond(c.A, c.B)) / 2, fx: (fx, c) => { fx.bond(c.A, c.B, -0.5); fx.time(c.tid, 5); } },
    'argue-wrong': { w: c => (10 - c.S(c.lead, 'intuition')) / 3, fx: (fx, c) => { fx.bond(c.A, c.B, -1); fx.time(c.tid, 25); } },
    'ask-local': { w: c => c.S(c.lead, 'social') / 4, fx: (fx, c) => { fx.time(c.tid, 5); fx.believe([c.A, c.B], { about: 'way', claim: 'asked', value: c.stretch?.id }); } },
  } }),
  K({ id: 'transport-pick', family: 1, moments: ['fare'], endings: {
    taxi: { w: c => c.money(c.tid) / 50, fx: (fx, c) => { fx.mind(c.lead, 'stress', -2); fx.time(c.tid, -3); } },
    cheap: { w: c => 1 + 50 / Math.max(10, c.money(c.tid)), fx: (fx, c) => { fx.time(c.tid, 8); fx.money(c.tid, 5); } },
    split: { w: 0.5, fx: (fx, c) => both(fx, c, 'stress', 3) },
  } }),
  // planning happens on the plane and in the queue, not on the run to the mat
  K({ id: 'plan-the-leg', family: 1, moments: ['plane', 'wait', 'quiet'],
    when: c => (c.stretch?.kind === 'mat' ? 0 : c.moment === 'plane' || c.moment === 'wait' || c.stretch?.mode === 'flight' ? 1 : 0.25), endings: {
    strategy: { w: c => c.S(c.lead, 'strategic') / 3, fx: (fx, c) => { fx.note(`plan:${c.tid}`, c.state.leg); fx.believe([c.A, c.B], { about: 'plan', claim: 'leg', value: c.state.leg }); } },
    drift: { w: 1, fx: (fx, c) => both(fx, c, 'morale', 3) },
    ignored: { w: c => (10 - c.S(other(c), 'strategic')) / 6, fx: (fx, c) => { fx.bond(c.A, c.B, -0.3); fx.mind(c.lead, 'stress', 3); } },
  } }),
  K({ id: 'pep-talk', family: 1, moments: ['fail', 'fear'], when: c => (c.fails >= 1 || c.moment === 'fear' ? 1 : 0), endings: {
    works: { w: c => c.S(c.lead, 'social') / 3, fx: (fx, c) => { fx.pass(c.tid, 0.08); fx.mind(other(c), 'morale', 5); } },
    'falls-flat': { w: 1, fx: (fx, c) => fx.mind(other(c), 'stress', 4) },
    backfires: { w: c => (10 - c.S(other(c), 'temperament')) / 8, fx: (fx, c) => { fx.mind(other(c), 'stress', 6); fx.bond(c.A, c.B, -0.3); } },
  } }),
  K({ id: 'manage-partner', family: 1, moments: ['fail', 'quiet'], when: c => (c.fails >= 1 || Math.min(c.energy(c.A), c.energy(c.B)) < 40 ? 0.8 : 0.1), endings: {
    bribe: { w: c => (c.money(c.tid) > 10 ? 1 : 0.1), fx: (fx, c) => { fx.pass(c.tid, 0.06); fx.money(c.tid, -5); } },
    'reverse-psych': { w: c => c.S(c.lead, 'strategic') / 5, fx: (fx, c) => { fx.pass(c.tid, 0.1); fx.bond(c.A, c.B, -0.3); } },
    distract: { w: 1, fx: (fx, c) => { fx.pass(c.tid, 0.06); fx.mind(other(c), 'stress', -5); } },
    token: { w: c => Math.max(0.1, c.bond(c.A, c.B) / 4), fx: (fx, c) => { fx.pass(c.tid, 0.08); fx.bond(c.A, c.B, 0.5); } },
    'cover-mouth': { w: c => c.S(c.lead, 'boldness') / 8, fx: (fx, c) => { fx.pass(c.tid, 0.12); fx.bond(c.A, c.B, -0.5); } },
  } }),
  K({ id: 'fear-through', family: 1, moments: ['fear'], endings: {
    'talked-down': { w: c => 1 + Math.max(0, c.bond(c.A, c.B)) / 3, fx: (fx, c) => fx.bond(c.A, c.B, 1) },
    freezes: { w: c => (10 - c.S(c.A, 'boldness')) / 4, fx: (fx, c) => { fx.time(c.tid, 15); fx.mind(c.A, 'stress', 8); } },
    swap: { w: c => (c.stretch?.kind === 'allin' ? 0.6 : 0), fx: (fx, c) => { fx.bond(c.A, c.B, 0.5); fx.pass(c.tid, 0.05); } },
  } }),
  K({ id: 'refuse', family: 1, moments: ['tip'], when: c => (has(c, 'stomach', 'perform') ? 0.1 + (10 - c.S(c.A, 'temperament')) / 60 : 0), endings: {
    relents: { w: 2, fx: (fx, c) => fx.time(c.tid, 10) },
    holds: { w: c => c.S(c.A, 'loyalty') / 10, fx: (fx, c) => fx.pending(c.tid, 30) },
    adapts: { w: 1, fx: (fx, c) => { fx.time(c.tid, 10); fx.mind(c.A, 'morale', 3); } },
  } }),
  K({ id: 'embarrassed', family: 1, moments: ['tip'], when: c => (has(c, 'perform') ? 0.3 : 0), endings: {
    'does-it': { w: 2, fx: (fx, c) => fx.mind(c.A, 'morale', -2) },
    bargains: { w: 1, fx: (fx, c) => { fx.bond(c.A, c.B, 0.3); fx.time(c.tid, 3); } },
    'role-swap': { w: 1, fx: (fx, c) => fx.bond(c.A, c.B, 0.3) },
  } }),
  K({ id: 'blame', family: 1, moments: ['fail', 'mat'], when: c => (c.fails >= 2 || c.event?.last ? 1 : 0), endings: {
    accepted: { w: c => c.S(other(c), 'temperament') / 3, fx: (fx, c) => fx.bond(c.A, c.B, -0.2) },
    deflected: { w: 1, fx: (fx, c) => fx.bond(c.A, c.B, -1) },
    'blow-up': { w: c => (10 - Math.min(c.S(c.A, 'temperament'), c.S(c.B, 'temperament'))) / 6, fx: (fx, c) => { fx.bond(c.A, c.B, -1.5); fx.snap(c.tid, true); } },
  } }),
  K({ id: 'celebrate', family: 1, moments: ['pass', 'mat'], when: c => (c.event?.passed || c.event?.first ? 1 : 0.2), endings: {
    hug: { w: c => 1 + Math.max(0, c.bond(c.A, c.B)) / 3, fx: (fx, c) => { fx.bond(c.A, c.B, 0.5); both(fx, c, 'morale', 5); } },
    'gloat-at-others': { w: c => ((c.present || []).length > 1 ? c.S(c.lead, 'boldness') / 8 : 0), fx: (fx, c) => { both(fx, c, 'morale', 3); fx.note(`gloated:${c.tid}`, c.state.leg); } },
    jinx: { w: 0.3, fx: (fx, c) => { both(fx, c, 'morale', 3); fx.note(`jinx:${c.tid}`, c.state.leg); } },
  } }),
  K({ id: 'old-wound', family: 1, moments: ['fail', 'quiet'], when: c => (Math.max(c.stress(c.A), c.stress(c.B)) > 50 ? 0.15 : 0) * (secretOut(c) ? 0.1 : 1), endings: {
    surfaces: { w: 1, fx: (fx, c) => fx.bond(c.A, c.B, -1) },
    'told-calmly': { w: c => c.S(c.A, 'temperament') / 5, fx: (fx, c) => fx.bond(c.A, c.B, 1) },
    explodes: { w: c => (10 - c.S(c.A, 'temperament')) / 6, fx: (fx, c) => { fx.bond(c.A, c.B, -1.5); fx.snap(c.tid, true); } },
  } }),
  K({ id: 'money-worry', family: 1, moments: ['fare', 'tip'], when: c => (c.money(c.tid) < 40 ? 1 : 0), endings: {
    plan: { w: c => c.S(c.lead, 'strategic') / 4, fx: (fx, c) => fx.mind(c.lead, 'stress', -2) },
    blame: { w: 1, fx: (fx, c) => fx.bond(c.A, c.B, -0.5) },
    'beg-now': { w: c => c.S(c.lead, 'boldness') / 6, fx: (fx, c) => { fx.note(`beg:${c.tid}`, c.state.leg); fx.mind(c.lead, 'stress', 3); } },
  } }),
  K({ id: 'watching-botch', family: 1, moments: ['botch-watch'], endings: {
    cheer: { w: c => 1 + Math.max(0, c.bond(c.A, c.B)) / 4, fx: (fx, c) => fx.pass(c.tid, 0.04) },
    'coach-illegal': { w: c => (c.stress(c.B) > 60 ? 0.3 : 0.05), fx: (fx, c) => fx.pending(c.tid, 30) },
    nerves: { w: c => (10 - c.S(c.B, 'temperament')) / 6, fx: (fx, c) => fx.mind(c.B, 'stress', 4) },
    quiet: { w: 0.5, fx: (fx, c) => fx.mind(c.B, 'stress', 1) },
  } }),
  K({ id: 'silent-treatment', family: 1, moments: ['quiet', 'travel'], when: c => (c.state.snapped[c.tid] ? 1 : 0), endings: {
    thaws: { w: c => 1 + c.bond(c.A, c.B) / 5, fx: (fx, c) => { fx.snap(c.tid, false); fx.bond(c.A, c.B, 0.3); } },
    holds: { w: 1, fx: (fx, c) => fx.bond(c.A, c.B, -0.3) },
    breaks: { w: c => (10 - c.S(c.A, 'temperament')) / 8, fx: (fx, c) => fx.bond(c.A, c.B, -1) },
  } }),
  K({ id: 'makeup', family: 1, moments: ['makeup'], endings: {
    apology: { w: 1, fx: (fx, c) => { fx.snap(c.tid, false); fx.bond(c.A, c.B, 0.5); } },
    'laugh-it-off': { w: 1, fx: (fx, c) => { fx.snap(c.tid, false); fx.bond(c.A, c.B, 0.5); } },
    'grand-gesture': { w: 0.4, fx: (fx, c) => { fx.snap(c.tid, false); fx.bond(c.A, c.B, 1.5); } },
  } }),
  K({ id: 'breakup', family: 1, moments: ['mat', 'quiet'], when: c => (DATING.includes(c.rel) && c.bond(c.A, c.B) <= -4 ? 0.5 : 0), endings: {
    'ends-it': { w: 1, fx: (fx, c) => { fx.rel(c.tid, 'exes'); fx.bond(c.A, c.B, -2); } },
    'not-yet': { w: 1, fx: (fx, c) => fx.bond(c.A, c.B, -0.5) },
  } }),
  K({ id: 'back-together', family: 1, moments: ['quiet', 'mat'], when: c => (['exes', 'on-off'].includes(c.rel) && c.bond(c.A, c.B) >= 4 ? 0.5 : 0), endings: {
    kiss: { w: 1, fx: (fx, c) => { fx.rel(c.tid, 'dating'); fx.bond(c.A, c.B, 1); } },
    almost: { w: 1, fx: (fx, c) => fx.bond(c.A, c.B, 0.5) },
  } }),
  K({ id: 'homesick', family: 1, moments: ['quiet', 'plane'],
    when: c => (Math.min(c.morale(c.A), c.morale(c.B)) < 40 ? 0.6 : c.state.leg >= 5 ? 0.03 * (c.state.leg - 4) / 4 : 0), endings: {
    'misses-home': { w: 1, fx: (fx, c) => fx.mind(c.A, 'morale', -5) },
    'partner-lifts': { w: c => 1 + Math.max(0, c.bond(c.A, c.B)) / 4, fx: (fx, c) => { fx.bond(c.A, c.B, 1); fx.mind(c.A, 'morale', 8); } },
    'wants-out': { w: c => (10 - c.S(c.A, 'endurance')) / 8, fx: (fx, c) => fx.mind(c.A, 'stress', 8) },
  } }),
  K({ id: 'call-home', family: 1, moments: ['reward'], endings: {
    joy: { w: 4, fx: (fx, c) => both(fx, c, 'morale', 25) },
    'bad-news': { w: 1, fx: (fx, c) => fx.mind(c.A, 'morale', -20) },
  } }),
  K({ id: 'bond-moment', family: 1, moments: ['quiet', 'plane', 'mat'], when: c => (c.bond(c.A, c.B) >= 0 ? 1 : 0.1), endings: {
    laugh: { w: 1, fx: (fx, c) => fx.bond(c.A, c.B, 0.3) },
    memory: { w: 1, fx: (fx, c) => fx.bond(c.A, c.B, 0.5) },
    gratitude: { w: c => Math.max(0.1, c.bond(c.A, c.B) / 4), fx: (fx, c) => fx.bond(c.A, c.B, 1) },
  } }),
  K({ id: 'separation', family: 1, moments: ['separate'], endings: {
    regroup: { w: 2, fx: (fx, c) => fx.time(c.tid, 20) },
    'different-rules': { w: 1, fx: (fx, c) => fx.time(c.tid, 40) },
  } }),
  K({ id: 'leader-shift', family: 1, moments: ['lead'], endings: {
    'takes-charge': { w: c => c.S(other(c), 'boldness'), fx: (fx, c) => fx.lead(c.tid, other(c)) },
    'gives-way': { w: c => c.S(c.lead, 'loyalty'), fx: (fx, c) => { fx.lead(c.tid, other(c)); fx.bond(c.A, c.B, 0.3); } },
  } }),
  // emitted by team.js (not a catalogue row of its own: the catalogue's "→ snap")
  K({ id: 'snap', family: 1, moments: ['snap'], endings: {
    snap: { w: 2, fx: (fx, c) => { fx.snap(c.tid, true); fx.bond(c.A, c.B, -1); } },
    'cold-shoulder': { w: 1, fx: (fx, c) => { fx.snap(c.tid, true); fx.bond(c.A, c.B, -1); } },
  } }),
]);
