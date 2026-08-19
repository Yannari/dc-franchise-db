// ══════════════════════════════════════════════════════════════════════
// bb-events/side-bet.js — the rail is public, and the block can count
// ══════════════════════════════════════════════════════════════════════
//
// The side bet's own spec promised a social bite — "the target may work out
// who backed them" — and the audit found the bite mostly missing: two bond
// writes in the module and no family reading the rail at all. Yet the rail is
// the single most legible thing the money does all week: a nominee sitting on
// the block can literally watch people queue up to bet on the eviction.
//
// THE PRIVACY RULE SHAPES EVERY EVENT HERE. Walking to the rail is public;
// the SLIP is private. So no beat may state whose name was on a bet — a
// nominee GUESSES, the family checks the slip only to know whether the guess
// was right, and the text never confirms it either way. Same machinery as the
// invisible HOH's blame: the grievance lands where the guess lands.
//
// And the standing law: THEY COULD TAKE IT WELL OR LESS WELL, REALLY DEPENDS.
import { gs } from '../core.js';
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

const _rail = (ctx, house) => {
  const bets = ctx?.week?.sideBets?.bets || [];
  const bettors = bets.filter(b => b?.name && house.includes(b.name));
  return bettors.length ? { bets, bettors } : null;
};
const _block = (ctx, house) =>
  (ctx?.week?.finalNominees || ctx?.week?.initialNominees || []).filter(n => house.includes(n));

// ── the nominee counts the rail ───────────────────────────────────────
const countsTheRail = {
  id: 'side-bet-counts-the-rail',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('side-bet-counts-the-rail', Number(ctx?.week?.num) || 0)) return 0;
    const rail = _rail(ctx, house);
    return rail && _block(ctx, house).length ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const rail = _rail(ctx, house);
    const nom = _block(ctx, house)[0];
    if (!nom) return null;
    const st = pStats(nom);
    const p = pronouns(nom);
    // Gallows humour or a private list — temperament decides.
    const laughs = st.temperament >= 5.5;
    if (laughs) {
      const railNames = rail.bettors.slice(0, 3).map(b => b.name);
      const text = _variant([
        `${nom} watches the queue form at the rail from the block and starts taking requests: "If you're betting on me, at least say something nice at the door Thursday." The rail laughs. Nervously.`,
        `${nom} asks the floor, loudly, whether nominees can bet on THEMSELVES, because ${p.sub} would like a piece of this either way. Half the rail laughs and the other half suddenly remembers somewhere to be.`,
        `"Ten on me, easy money." ${nom} says it to ${railNames[0] || 'the rail'} with a grin that costs more than it shows, and the room decides ${p.sub} is handling it beautifully. The room is half right.`,
      ], ctx, nom);
      api.popDelta(nom, 1);
      return { text, players: [nom, rail.bettors[0]?.name].filter(Boolean),
        badgeText: 'LAUGHS AT THE RAIL', badgeClass: 'gold' };
    }
    // The guess. The slip is private, so the nominee picks the bettor they
    // trust least — and the family checks the slip only to record whether the
    // grievance landed on the right person. The text never says.
    const guessed = [...rail.bettors]
      .sort((a, b) => perceived(nom, a.name) - perceived(nom, b.name))[0];
    const correct = guessed?.on === nom;
    const text = _variant([
      `${nom} watched every single person who went to that rail, and has stopped talking to one of them. ${guessed.name} notices the temperature first.`,
      `${nom} does the arithmetic from the block: betting is public, and ${guessed.name} could not get to the window fast enough. The slip is private. The freeze-out is not.`,
      `${nom} says nothing, which from the block is its own announcement. By evening ${guessed.name} is asking people why ${nom} keeps looking at ${pronouns(guessed.name).obj} like that.`,
    ], ctx, nom, guessed.name);
    api.addBond(nom, guessed.name, -0.7);
    api.remember(nom, guessed.name, correct ? 'bet-against-me' : 'blamed-for-a-bet', 1.5,
      { twist: 'side-bet', correct });
    return { text, players: [nom, guessed.name], badgeText: 'COUNTS THE RAIL', badgeClass: 'red' };
  },
};

// ── the conspicuous collector, the morning after ──────────────────────
//
// Somebody got PAID on an eviction, in public, and the evicted had friends
// who are still in the building. Reads last week's settlement, because the
// floor pays after the vote and the reckoning is the next morning.
const collected = {
  id: 'side-bet-collected',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('side-bet-collected', Number(ctx?.week?.num) || 0)) return 0;
    const num = Number(ctx?.week?.num) || 0;
    if (num < 2) return 0;
    const prev = (gs.bb?.weeks || []).find(w => Number(w?.num) === num - 1);
    const win = (prev?.sideBetResults?.results || [])
      .find(r => r?.won && house.includes(r.name));
    return win ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const num = Number(ctx.week.num);
    const prev = (gs.bb?.weeks || []).find(w => Number(w?.num) === num - 1);
    const win = (prev?.sideBetResults?.results || [])
      .find(r => r?.won && house.includes(r.name));
    if (!win) return null;
    const who = win.name;
    const evicted = prev?.sideBetResults?.evicted || prev?.evicted;
    // The evicted's closest friend still in the building is the one who minds.
    const mourner = evicted
      ? _others(house, who).sort((a, b) => perceived(b, evicted) - perceived(a, evicted))[0]
      : null;
    const minds = mourner && perceived(mourner, evicted) >= 2;
    if (minds) {
      const text = _variant([
        `${mourner} watched ${who} collect on ${evicted}'s eviction before the door had finished closing, and has not managed to unsee it. "You made MONEY on my friend."`,
        `${who} was gracious about winning, which somehow makes it worse. ${mourner} keeps a smile up all morning and something else underneath it.`,
        `"It's just the game," ${who} says, and it is. ${mourner} agrees that it is, out loud, and moves ${who} up a private list all the same.`,
      ], ctx, who, mourner);
      api.addBond(mourner, who, -0.8);
      api.remember(mourner, who, 'profited-on-my-friend', 1.5, { twist: 'side-bet' });
      return { text, players: [mourner, who], badgeText: 'PAID ON A FRIEND', badgeClass: 'red' };
    }
    const watcher = _others(house, who)
      .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
    const text = _variant([
      `${who} called the eviction to the vote, and ${watcher || 'the house'} clocks what that actually means: somebody in this building can read the room well enough to bet on it. That is not luck twice.`,
      `The floor paid ${who} out in front of everybody, and the real prize is the reputation: ${who} KNEW. People who know things get talked to more carefully.`,
      `${watcher || 'Somebody'} starts sitting a little nearer to ${who} at meals. Not friendship — instrumentation. You keep the good barometer where you can see it.`,
    ], ctx, who);
    if (watcher) {
      api.suspicion(watcher, who, 1.0);
      api.remember(watcher, who, 'reads-the-house-for-money', 1, { twist: 'side-bet' });
    }
    return { text, players: [who, watcher].filter(Boolean),
      badgeText: 'THE BAROMETER', badgeClass: 'blue' };
  },
};

export const SIDE_BET_EVENTS = [countsTheRail, collected];
