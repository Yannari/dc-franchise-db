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
import { pronouns } from '../players.js';
import { pStats, band, perceived, closestTo } from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
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
    const text = _variant([
      `${who} has stopped saying "I think" about ${guess} and started saying "we all know". ${listeners[0]} does not agree, exactly, but does not disagree in front of anybody either — and that is how a theory becomes the house's position.`,
      `The third key gets relitigated over dishes. ${who} lays out the case against ${guess}; ${listeners[0]} adds a detail that is not evidence; ${listeners[1] || 'somebody else'} repeats the whole thing an hour later as established fact.`,
      `Nobody in this house can prove who turned that key, so the house does the next best thing and votes on it informally, all week, in small groups. ${guess} keeps losing that vote.`,
      `${who} tells ${listeners[0]} that ${guess} "went weird" the morning of the competition. ${guess} did not. It will be repeated four more times before Thursday, improving each time.`,
    ], ctx, who, guess);
    listeners.forEach(n => api.suspicion(n, guess, 0.55));
    api.suspicion(who, guess, 0.4);
    return { text, players: [who, guess, ...listeners.slice(0, 2)].filter((n, i, a) => a.indexOf(n) === i),
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
    const p = pronouns(guess);
    const st = pStats(guess);
    // Denying it well is a social stat. Denying it badly makes it true.
    const convincing = st.social * 0.6 + st.temperament * 0.4 >= 6;
    const text = correct ? _variant([
      `${who} asks ${guess} directly whether ${guess} was behind the third nomination. ${guess} says no, asks why ${who} suspects `
        + `${pronouns(guess).obj}, and gives away nothing useful. ${who} leaves without withdrawing the accusation.`,
      `"Why would I put you up and then sit here talking to you about it?" It is a good question. ${guess} is counting on ${who} not noticing it is also not an answer.`,
      `${guess} handles the accusation the way you handle a hot pan — quickly, and without looking at it directly. ${who} notices the speed.`,
      `${who} asks ${guess} straight out. ${guess} says no. One of them is lying, and this time it is not the person being accused of lying.`,
    ], ctx, who, guess) : _variant([
      `${guess} asks how ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} supposed to prove ${p.sub} did not secretly win a competition nobody watched. ${convincing ? `${who} admits there is no answer to that.` : `${who} treats the lack of an answer as proof.`}`,
      `"I didn't nominate you. I couldn't have — I don't even know who won that thing." ${guess} answers before ${who} has finished the accusation, and the speed of the denial makes it sound rehearsed.`,
      `${guess} spends the week defending something ${p.sub} did not do, against somebody who has decided ${p.sub} did, using the only defence available: saying so.`,
      `${guess} finally asks the obvious question — "what would I even gain?" — and ${who} answers it with a shrug, because the theory never needed a motive to get this far.`,
    ], ctx, who, guess);
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
    return { text, players: [guess, who],
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
    const text = _variant([
      `The veto comes off and the chair fills again with nobody's name on it. ${reader} says what everybody is thinking: whoever turned the first key just turned the second one, and they did it in the same room as the rest of us.`,
      `Two anonymous nominations in one week. ${reader} stops treating it as a mystery and starts treating it as a signature — the same handwriting twice — and begins matching it against faces.`,
      `${reader} points at the wall: "That's not the HOH. That's the same person as Friday." The room, which had been enjoying the confusion, stops enjoying it.`,
      `The second key turns and something changes in the house's mood — this is not a one-off any more, it is somebody with a pen, and ${reader} intends to find out whose.`,
    ], ctx, reader, suspect);
    api.suspicion(reader, suspect, right ? 1.6 : 0.9);
    if (right) {
      try { api.remember(reader, suspect, 'suspected-roadkill', 1, { twist: 'bb-roadkill', correct: true }); } catch { /* texture */ }
    }
    return { text, players: [reader, suspect],
      badgeText: right ? 'THE SAME HANDWRITING' : 'A SIGNATURE, MISREAD',
      badgeClass: right ? 'gold' : 'grey' };
  },
};

export const ROADKILL_EVENTS = [thirdKeyTheory, accusedDefends, secondSignature];
