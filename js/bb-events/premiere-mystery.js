// ══════════════════════════════════════════════════════════════════════
// bb-events/premiere-mystery.js — the hotel's first week, and the man
// with the money
// ══════════════════════════════════════════════════════════════════════
//
// A Summer of Mystery's own cards were the audit's third theme with the gap:
// nothing read `week.premiereMystery` or `week.secretPowerComp`, so the two
// loudest facts the theme produces on purpose — somebody won ten thousand
// dollars IN PUBLIC on night one, and somebody posted the best score of an
// afternoon and was mysteriously not crowned for it — never came up again.
// Both of those are designed to be watched. Nobody was watching.
//
// PRIVACY SHAPES BOTH HALVES. The host winner's money is public and the power
// it secretly bought is not — so beats may needle the cash and CIRCLE the
// calm, but never state the power. The secret comp's scores are public and
// what each player was running for is not — so a reader may clock the
// anomaly, and the text never explains it. The house being almost right is
// the theme.
//
// And the standing law: THEY COULD TAKE IT WELL OR LESS WELL, REALLY DEPENDS.
import { pronouns } from '../players.js';
import { pStats, band, perceived, firedThisWeek } from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';

// ── the man with the money ────────────────────────────────────────────
const richMan = {
  id: 'premiere-rich-man',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('premiere-rich-man', Number(ctx?.week?.num) || 0)) return 0;
    const pm = ctx?.week?.premiereMystery;
    return pm?.hostWinner && house.includes(pm.hostWinner) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const who = ctx.week.premiereMystery.hostWinner;
    const p = pronouns(who);
    const watcher = _others(house, who)
      .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
    if (!watcher) return null;
    // An intuitive watcher circles the calm; everybody else circles the cash.
    const circles = pStats(watcher).intuition >= 6;
    if (circles) {
      const text = _variant([
        `${watcher} keeps coming back to the wrong detail: not the ten thousand, the CALM. ${who} painted the biggest target of the night onto ${p.posAdj} own back and has slept like a stone ever since. People with targets do not sleep like that.`,
        `"Ten grand should make a person nervous." ${watcher} says it to nobody, watching ${who} hum through the washing-up. Something about the maths of ${who}'s mood refuses to balance.`,
        `${watcher} has met people who won money before. They check the room more, after. ${who} checks it LESS, and ${watcher} cannot find the version of night one that explains it.`,
      ], ctx, who, watcher);
      api.suspicion(watcher, who, 1.3);
      api.remember(watcher, who, 'too-calm-for-the-money', 1.5, { twist: 'premiere-mystery' });
      return { text, players: [watcher, who], badgeText: 'THE CALM, CIRCLED', badgeClass: 'grey' };
    }
    const text = _variant([
      `${watcher} has started pricing things in ${who}-units — "that's a tenth of what ${who} made on night one" — and the joke has legs precisely because nobody is entirely joking.`,
      `${who} offers to make the tea and somebody asks if ${p.sub} can afford it. The kitchen laughs. ${who} laughs longest, which is the correct play and everybody knows it is a play.`,
      `The first vote count anybody sketches this season has ${who}'s name pencilled at the top, with a number next to it instead of a reason.`,
    ], ctx, who, watcher);
    api.popDelta(who, -0.5);
    api.remember(watcher, who, 'the-ten-thousand', 1, { twist: 'premiere-mystery' });
    return { text, players: [watcher, who], badgeText: 'PRICED IN PUBLIC', badgeClass: 'blue' };
  },
};

// ── the one who chose who got to play ─────────────────────────────────
const namedTheFour = {
  id: 'premiere-named-the-four',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('premiere-named-the-four', Number(ctx?.week?.num) || 0)) return 0;
    const pm = ctx?.week?.premiereMystery;
    return pm?.relicWinner && house.includes(pm.relicWinner) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const who = ctx.week.premiereMystery.relicWinner;
    const p = pronouns(who);
    const speaker = _others(house, who)
      .sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
    if (!speaker) return null;
    const st = pStats(who);
    // Wearing the decision or apologising for it — social carries the wear.
    const wears = st.social >= 5.5;
    if (wears) {
      const text = _variant([
        `${speaker} needles ${who} about playing kingmaker on night one, and ${who} does not flinch: "Somebody was going to hold that relic. Be glad it was somebody who likes you." It lands as charm and files as warning.`,
        `${who} owns the four names without apology — "you'd have picked YOUR four too" — and the honesty buys more room than any excuse would have.`,
        `${who} takes the kingmaker jokes with a grin all week, and only ${speaker} notices that ${p.sub} never once says the four names were random.`,
      ], ctx, who, speaker);
      api.popDelta(who, 0.5);
      api.remember(speaker, who, 'comfortable-choosing', 1, { twist: 'premiere-mystery' });
      return { text, players: [who, speaker], badgeText: 'WEARS THE RELIC', badgeClass: 'gold' };
    }
    const text = _variant([
      `${who} is still explaining the four names two days later, to people who had stopped asking. Every explanation adds a person who was not in it.`,
      `${speaker} asks, mildly, what it felt like to pick who got to play for power on night one. ${who}'s answer takes ninety seconds and satisfies nobody, including ${who}.`,
      `${who} tries "it was practically alphabetical" on a house that has already checked. It was not practically alphabetical. The kitchen keeps that one for later.`,
    ], ctx, who, speaker);
    api.popDelta(who, -0.5);
    api.addBond(speaker, who, -0.4);
    return { text, players: [who, speaker], badgeText: 'THE FOUR NAMES AGE BADLY', badgeClass: 'red' };
  },
};

// ── the best score in the room, and no crown on it ────────────────────
//
// The secret power competition's designed anomaly: somebody posts the top
// score of the afternoon and is not Head of Household, because they were
// never running for it — and the house is told nothing. The text must never
// explain it either; the house being almost right is the theme.
const anomaly = {
  id: 'secret-comp-anomaly',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('secret-comp-anomaly', Number(ctx?.week?.num) || 0)) return 0;
    const sc = ctx?.week?.secretPowerComp;
    if (!sc?.results?.length) return 0;
    const best = [...sc.results].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
    const chased = (sc.chased || []).some(c => c?.name === best?.name);
    return best && chased && house.includes(best.name) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const sc = ctx.week.secretPowerComp;
    const best = [...sc.results].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
    const who = best.name;
    const p = pronouns(who);
    const reader = _others(house, who)
      .sort((a, b) => pStats(b).intuition + pStats(b).strategic
        - pStats(a).intuition - pStats(a).strategic)[0];
    if (!reader) return null;
    // The scorer's cover is social; a bad liar makes the anomaly worse.
    const covers = pStats(who).social >= 5.5;
    if (covers) {
      const text = _variant([
        `${reader} cannot let it go: ${who} posted the best score of the whole afternoon and is not wearing the crown. ${who} shrugs — "choked the last bit, didn't I" — and the shrug is good. The maths still is not.`,
        `${reader} re-runs the board out loud at dinner. Top score, no crown. ${who} laughs along at ${p.posAdj} own "collapse", charmingly, and ${reader} notices the laugh arrives a half-second rehearsed.`,
        `"Fastest legs in the house and somehow not Head of Household." ${reader} says it as a compliment. It is not a compliment. ${who} accepts it as one anyway, beautifully.`,
      ], ctx, who, reader);
      api.suspicion(reader, who, 1.2);
      api.remember(reader, who, 'the-score-with-no-crown', 1.5, { twist: 'secret-power-comp' });
      return { text, players: [reader, who], badgeText: 'THE BOARD DOES NOT ADD UP', badgeClass: 'grey' };
    }
    const text = _variant([
      `${reader} asks ${who}, directly, how the best score of the day loses. ${who}'s explanation has three versions by evening, and ${reader} has collected all three.`,
      `${who} gets cornered on the arithmetic and reaches for "the pressure got me", which would land better from somebody who had looked pressured. The kitchen goes quietly certain of nothing in particular.`,
      `Every time the comp comes up, ${who} changes the subject with the smoothness of a dropped tray. The house does not know WHAT it is looking at. It knows it is looking at something.`,
    ], ctx, who, reader);
    api.suspicion(reader, who, 1.5);
    api.popDelta(who, -0.5);
    return { text, players: [reader, who], badgeText: 'A DROPPED TRAY', badgeClass: 'red' };
  },
};

export const PREMIERE_MYSTERY_EVENTS = [richMan, namedTheFour, anomaly];
