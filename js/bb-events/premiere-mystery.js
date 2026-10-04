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
import { pStats, band, perceived, firedThisWeek } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

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
    const watcher = _others(house, who)
      .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
    if (!watcher) return null;
    // An intuitive watcher circles the calm; everybody else circles the cash.
    const circles = pStats(watcher).intuition >= 6;
    if (circles) {
      const scene = makeScene('premiere.rich', { a: watcher, b: who }, { ending: 'circles' }, [], 'kitchen');
      api.suspicion(watcher, who, 1.3);
      api.remember(watcher, who, 'too-calm-for-the-money', 1.5, { twist: 'premiere-mystery' });
      return { scene, players: [watcher, who], badgeText: 'THE CALM, CIRCLED', badgeClass: 'grey' };
    }
    const scene = makeScene('premiere.rich', { a: watcher, b: who }, { ending: 'priced' }, [], 'kitchen');
    api.popDelta(who, -0.5);
    api.remember(watcher, who, 'the-ten-thousand', 1, { twist: 'premiere-mystery' });
    return { scene, players: [watcher, who], badgeText: 'PRICED IN PUBLIC', badgeClass: 'blue' };
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
    const speaker = _others(house, who)
      .sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
    if (!speaker) return null;
    const st = pStats(who);
    // Wearing the decision or apologising for it — social carries the wear.
    const wears = st.social >= 5.5;
    if (wears) {
      const scene = makeScene('premiere.four', { a: who, b: speaker }, { ending: 'owns' }, [], 'living-room');
      api.popDelta(who, 0.5);
      api.remember(speaker, who, 'comfortable-choosing', 1, { twist: 'premiere-mystery' });
      return { scene, players: [who, speaker], badgeText: 'WEARS THE RELIC', badgeClass: 'gold' };
    }
    const scene = makeScene('premiere.four', { a: who, b: speaker }, { ending: 'ages' }, [], 'living-room');
    api.popDelta(who, -0.5);
    api.addBond(speaker, who, -0.4);
    return { scene, players: [who, speaker], badgeText: 'THE FOUR NAMES AGE BADLY', badgeClass: 'red' };
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
    const reader = _others(house, who)
      .sort((a, b) => pStats(b).intuition + pStats(b).strategic
        - pStats(a).intuition - pStats(a).strategic)[0];
    if (!reader) return null;
    // The scorer's cover is social; a bad liar makes the anomaly worse.
    const covers = pStats(who).social >= 5.5;
    if (covers) {
      const scene = makeScene('secret.anomaly', { a: reader, b: who }, { ending: 'covers' }, [], 'kitchen');
      api.suspicion(reader, who, 1.2);
      api.remember(reader, who, 'the-score-with-no-crown', 1.5, { twist: 'secret-power-comp' });
      return { scene, players: [reader, who], badgeText: 'THE BOARD DOES NOT ADD UP', badgeClass: 'grey' };
    }
    const scene = makeScene('secret.anomaly', { a: reader, b: who }, { ending: 'cracks' }, [], 'kitchen');
    api.suspicion(reader, who, 1.5);
    api.popDelta(who, -0.5);
    return { scene, players: [reader, who], badgeText: 'A DROPPED TRAY', badgeClass: 'red' };
  },
};

export const PREMIERE_MYSTERY_EVENTS = [richMan, namedTheFour, anomaly];
