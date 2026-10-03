// ══════════════════════════════════════════════════════════════════════
// bb-events/roadkill.js — the week after the third key turns
// ══════════════════════════════════════════════════════════════════════
//
// Roadkill shipped with its mechanic complete and its aftermath one card long:
// the third nominee picked a name on nomination night and the house never
// mentioned it again. Meanwhile `week.roadkillGuesses` — the record of who
// blamed whom, and who was wrong — sat in the week object unread by anything
// except the visual player's last screen.
//
// These are the follow-ups. They all read that record rather than the truth,
// which is the rule the twist runs on: the house acts on its guess, and a
// wrong guess costs an innocent houseguest exactly what a right one would cost
// the guilty. The only event allowed near the real winner is the one where
// somebody nearly catches them.
import { pStats, band, perceived, closestTo } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _rk = ctx => ctx?.week?.roadkill || null;
const _guesses = ctx => (ctx?.week?.roadkillGuesses || []).filter(g => g && g.who && g.guess);

// Casting is shared between weight() and fire() on purpose. The scheduler
// treats a positive weight as a promise that the event WILL produce a beat —
// returning null after being picked throws — so anything fire() needs, weight()
// has to have proved first.
const _liveGuess = (house, ctx) => _guesses(ctx).find(g =>
  house.includes(g.who) && house.includes(g.guess) && g.guess !== g.who) || null;

/** Who notices a second anonymous nomination, and who they decide did it. */
function _signatureCast(house, ctx) {
  const reader = _others(house, ...(ctx.week?.finalNominees || []))
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  if (!reader) return null;
  const truth = _rk(ctx)?.winner || null;
  const suspect = pStats(reader).intuition >= 7 && truth && truth !== reader
    ? truth
    : closestTo(reader, _others(house, reader, truth)) || null;
  return suspect ? { reader, suspect, truth } : null;
}

// ── the room takes up the case ────────────────────────────────────────
//
// The third nominee's blame card fires on nomination night and names one
// suspect. This is what that name does to the rest of the house afterwards:
// suspicion is contagious, and it spreads without ever acquiring evidence.
const thirdKeyTheory = {
  id: 'roadkill-third-key-theory',
  category: 'social',
  weight(house, ctx) {
    if (!_rk(ctx) || ctx.act !== 'house') return 0;
    const entry = _liveGuess(house, ctx);
    if (!entry) return 0;
    return _others(house, entry.who, entry.guess).length ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const entry = _liveGuess(house, ctx);
    if (!entry) return null;
    const { who, guess, correct } = entry;
    const listeners = _others(house, who, guess).slice(0, 3);
    if (!listeners.length) return null;
    const scene = makeScene('road.theory', { a: who, b: guess, c: listeners[0] }, { ending: 'scene' }, [], 'kitchen');
    listeners.forEach(n => api.suspicion(n, guess, 0.55));
    api.suspicion(who, guess, 0.4);
    return { scene, players: [who, guess, ...listeners.slice(0, 2)].filter((n, i, a) => a.indexOf(n) === i),
      badgeText: correct ? 'THE ROOM CONVERGES' : 'A RUMOUR WITH NO AUTHOR',
      badgeClass: correct ? 'gold' : 'red' };
  },
};

// ── the accused answers for something they may not have done ──────────
const accusedDefends = {
  id: 'roadkill-accused-defends',
  category: 'social',
  weight(house, ctx) {
    if (!_rk(ctx) || ctx.act !== 'house') return 0;
    return _liveGuess(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const entry = _liveGuess(house, ctx);
    if (!entry) return null;
    const { who, guess, correct } = entry;
    const st = pStats(guess);
    // Denying it well is a social stat. Denying it badly makes it true.
    const convincing = st.social * 0.6 + st.temperament * 0.4 >= 6;
    const scene = makeScene('road.defend', { a: who, b: guess }, { ending: correct ? 'guilty' : 'innocent' }, [], 'bedroom');
    if (!correct && !convincing) {
      // Being wrongly accused, badly denied, makes an enemy in both directions.
      api.addBond(guess, who, -0.8);
      try { api.remember(guess, who, 'grudge', 2, { twist: 'bb-roadkill', accusedOf: 'the third key' }); } catch { /* texture */ }
      api.suspicion(who, guess, 0.7);
    } else if (!correct) {
      api.addBond(guess, who, -0.3);
      api.suspicion(who, guess, -0.4);
    } else {
      api.suspicion(who, guess, convincing ? 0.3 : 1.2);
    }
    return { scene, players: [guess, who],
      badgeText: correct ? (convincing ? 'A GOOD LIE' : 'TOO QUICK') : (convincing ? 'THE TRUTH, UNPROVABLE' : 'GUILTY OF NOTHING'),
      badgeClass: correct ? 'gold' : 'red' };
  },
};

// ── the same invisible hand, twice in one week ────────────────────────
//
// When the veto saves the third nominee, the Roadkill winner refills the chair
// — a second anonymous nomination on the same wall. The house cannot miss the
// pattern, and the pattern is the closest thing to a clue this twist emits.
const secondSignature = {
  id: 'roadkill-second-signature',
  category: 'ceremonies',
  weight(house, ctx) {
    if (!_rk(ctx) || ctx.act !== 'house' || !ctx.week?.roadkillRefilled) return 0;
    return _signatureCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _signatureCast(house, ctx);
    if (!cast) return null;
    const { reader, suspect, truth } = cast;
    const right = suspect === truth;
    const scene = makeScene('road.signature', { a: reader, b: suspect }, { ending: 'scene' }, [], 'living-room');
    api.suspicion(reader, suspect, right ? 1.6 : 0.9);
    if (right) {
      try { api.remember(reader, suspect, 'suspected-roadkill', 1, { twist: 'bb-roadkill', correct: true }); } catch { /* texture */ }
    }
    return { scene, players: [reader, suspect],
      badgeText: right ? 'THE SAME HANDWRITING' : 'A SIGNATURE, MISREAD',
      badgeClass: right ? 'gold' : 'grey' };
  },
};

export const ROADKILL_EVENTS = [thirdKeyTheory, accusedDefends, secondSignature];
