// ══════════════════════════════════════════════════════════════════════
// THE NIGHT THEY GET ALCOHOL
// ══════════════════════════════════════════════════════════════════════
//
// The house gets a limited amount of drink once a week, and it is where a
// startling share of the real show happens: the fight that had been coming for
// eight days arrives, somebody says the thing they had decided not to say, two
// people who had been circling each other stop circling.
//
// So this is deliberately NOT another card in the pile. One more "they had a
// nice evening" beat adds texture and changes nothing. What a drinks night
// actually does is change the ODDS of everything else — it lowers the guard on
// a house that already had its grievances, and lets the events in the catalogue
// fire that were sitting just under the threshold all week.
//
// Two pieces, therefore:
//
//   nightModifier(ctx)  — the multiplier the scheduler applies to other events.
//                         Loosens tongues, sharpens tempers, dissolves caution.
//   DRINKS_EVENTS       — the night itself, and only the beats that need the
//                         drink to make sense: the confession, the toast, the
//                         one who does not drink and watches.
//
// The consequences are real in both directions, per the house rule that no
// event is cosmetic: bonds move, things get remembered, and somebody wakes up
// having told a person something they cannot take back.
import { gs } from '../core.js';
import { pronouns } from '../players.js';
import {
  pStats, bond, band, closestTo, trusts, dislikes, sharesAlliance,
  grudge, resentmentOf, isVillainous, spotlightOrder,
} from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

/**
 * Is tonight the night?
 *
 * Once a week, and not on the nights the house has something else to do. It
 * lands in the stretch between the veto and the vote, which is when the real
 * one lands and also when the house has the most to argue about: nominations
 * are known, the veto is spent, and everybody has three days to think about it.
 *
 * Stored on the week so every reader agrees, and so a second act in the same
 * week cannot decide it is drinks night all over again.
 */
export function isDrinksNight(ctx) {
  const week = ctx?.week;
  if (!week) return false;
  if (week._drinksNight !== undefined) return week._drinksNight === ctx?.act;
  // Not on the ceremonies themselves, and not on eviction night.
  const eligible = ctx?.act === 'campaign' || ctx?.act === 'house';
  if (!eligible) return false;
  // ── AN OCCASION, NOT THE WEATHER ──
  //
  // Measured at every eligible week this landed in 78% of them, about six a
  // season, and the opening scene is the same scene each time: the door opens
  // on a case of beer. Read six times it stops being a night and becomes
  // furniture, and the beats it exists to unlock stop feeling like the drink
  // caused them.
  //
  // Every third week, chosen from the week number rather than a roll so a
  // replayed season drinks on the same nights. Roughly two or three a season,
  // which is where it reads as the thing that happened this week.
  if ((Number(week.num) || 0) % 3 !== 2) return false;
  // A house too small for a party does not have one. At four people it is not
  // a night, it is four people in a room being careful with each other.
  if ((gs.activePlayers || []).length < 6) return false;
  week._drinksNight = ctx.act;
  return true;
}

/**
 * What the night does to everything else.
 *
 * The multiplier a scheduler applies to an event's own weight. Nothing here
 * invents a beat — it changes which of the beats already written get to happen.
 *
 * The shape is the point. Fights and confessions go UP hard, because that is
 * what drink does. Careful strategic work goes DOWN, because nobody runs a
 * clean vote count at two in the morning holding a plastic cup, and the ones
 * who try are the ones who wake up having said too much.
 */
export function nightModifier(category, id = '') {
  const bump = {
    social: 1.55,        // arguments, sparks, rumours, drifting apart
    'house-life': 1.35,  // the texture of a room with its guard down
    deals: 0.75,         // a deal struck drunk is a deal nobody trusts sober
    ceremonies: 1,
    phases: 1,
  }[category] ?? 1;
  // The specific ones drink is famous for.
  if (/blow-up|argument|fight|grudge|rumour|spark|showmance|confess/.test(id)) return bump * 1.3;
  // And the one it is famous for preventing.
  if (/paranoia|count|plan|whisper/.test(id)) return bump * 0.8;
  return bump;
}

/** How far somebody's guard drops. Low temperament and high boldness drop most. */
function _looseness(name) {
  const s = pStats(name);
  return Math.max(0.15, Math.min(1,
    (10 - (s.temperament || 5)) * 0.06 + (s.boldness || 5) * 0.05 + 0.1));
}

const _live = (house, ctx) => spotlightOrder(house.filter(Boolean));

// ══════════════════════════════════════════════════════════════════════
// THE NIGHT ITSELF
// ══════════════════════════════════════════════════════════════════════

/**
 * The night happening at all — the one card that sets the scene.
 *
 * Its consequence is not a bond change; it is that everybody in the room is
 * fractionally closer afterwards and one person is not. That asymmetry is what
 * makes the rest of the night's events land.
 */
const drinksNight = {
  id: 'drinks-night',
  category: 'house-life',
  weight(house, ctx) {
    if (!isDrinksNight(ctx)) return 0;
    if (ctx?.week?._drinksOpened) return 0;
    return band(7.5);
  },
  fire(house, ctx, api, rng = Math.random) {
    ctx.week._drinksOpened = true;
    const pool = _live(house, ctx);
    // Whoever holds back. Not a judgement — the most calculating houseguest in
    // the room is often the one nursing the same drink for two hours, and it is
    // the single most useful thing they do all week.
    const sober = pool.slice().sort((a, b) => _looseness(a) - _looseness(b))[0];
    const loudest = pool.slice().sort((a, b) => _looseness(b) - _looseness(a))[0];
    const p = pronouns(sober);

    const text = _variant([
      `The storage room door opens on a case of beer and a bottle of wine for the whole house, and the night changes shape around it. ${loudest} is three drinks in before anybody else has finished one. ${sober} pours a glass, holds it, and does not drink it.`,
      `Alcohol arrives. It is never enough for everybody and everybody knows the arithmetic, so the first ten minutes are elaborately polite and the next hour is not. ${sober} watches ${loudest} get loud and files it.`,
      `It is the one night a week the house is allowed to stop being careful, and it takes about forty minutes for the carefulness to go. ${loudest} is the first to say something ${p.sub} would not have said at noon. ${sober} is still on the first glass at midnight.`,
      `The bottle comes out. Somebody makes a toast that is meant to be funny and lands as sincere, and the room goes quiet for a second before deciding to laugh. ${sober} laughs a beat late, because ${p.sub} ${p.sub === 'they' ? 'were' : 'was'} watching who did not.`,
    ], ctx, sober, loudest);

    // Everybody who let their guard down ends the night a little closer to
    // everybody else who did. It is small and it is real, and it is why houses
    // that drink together fracture along different lines than houses that do not.
    for (const a of pool) {
      for (const b of pool) {
        if (a >= b || a === sober || b === sober) continue;
        // The seeded rng, not Math.random: a bare roll here would make a
        // replayed season diverge from the one it is replaying.
        if (rng() < 0.35) api.addBond(a, b, 0.25 * _looseness(a) * _looseness(b) * 4);
      }
    }
    // And the one who stayed sharp learns something about each of them.
    for (const other of pool) {
      if (other === sober) continue;
      if (_looseness(other) > 0.55) api.suspicion(sober, other, -0.15);
    }
    api.popDelta(loudest, 1);

    return {
      text, players: [sober, loudest].filter(Boolean),
      badgeText: 'THE HOUSE GETS ALCOHOL', badgeClass: 'gold',
    };
  },
};

/**
 * The thing said out loud that was not going to be said.
 *
 * Drink's real function in this game: information moves. Somebody tells
 * somebody a true thing about the house, and in the morning it is still true
 * and still told.
 */
const drunkConfession = {
  id: 'drinks-confession',
  category: 'social',
  weight(house, ctx) {
    if (!isDrinksNight(ctx) || !ctx?.week?._drinksOpened) return 0;
    const cast = _confessPair(house, ctx);
    return cast ? band(6 * _looseness(cast.teller)) : 0;
  },
  fire(house, ctx, api) {
    const { teller, listener } = _confessPair(house, ctx);
    const p = pronouns(teller);
    const close = bond(teller, listener) >= 3;

    const text = _variant([
      `${teller} tells ${listener} something ${p.sub} had decided at the start of the week not to tell anybody. It is not a lie and it is not a strategy, which is what makes it dangerous.`,
      `Halfway through a conversation about nothing, ${teller} says the quiet part: who ${p.sub} actually ${p.sub === 'they' ? 'trust' : 'trusts'}, and who ${p.sub} ${p.sub === 'they' ? 'do' : 'does'} not. ${listener} does not have to ask a single question.`,
      `"Can I tell you something?" ${teller} asks, and ${listener} says yes, and what follows is the most honest ninety seconds either of them has had in this house.`,
      `${teller} means to say one small thing to ${listener} and says four large ones. ${p.Sub} ${p.sub === 'they' ? 'know' : 'knows'} it while it is happening and keeps going anyway.`,
    ], ctx, teller, listener);

    // Told is told. The listener knows it in the morning whatever the teller
    // remembers, which is the whole reason this event exists.
    api.addBond(teller, listener, close ? 1.4 : 0.8);
    api.remember(listener, teller, 'told-me-something-true', 3, { about: 'the night the house drank' });
    if (!close) {
      // Somebody you are not close to now holds a real piece of you.
      api.suspicion(teller, listener, 0.5);
    }

    return {
      text, players: [teller, listener],
      badgeText: close ? 'SAID OUT LOUD' : 'TOLD THE WRONG PERSON',
      badgeClass: close ? 'blue' : 'red',
    };
  },
};

function _confessPair(house, ctx) {
  const pool = _live(house, ctx);
  if (pool.length < 3) return null;
  const teller = pool.slice().sort((a, b) => _looseness(b) - _looseness(a))[0];
  if (!teller) return null;
  const listener = closestTo(teller, pool.filter(n => n !== teller))
    || pool.find(n => n !== teller);
  return listener ? { teller, listener } : null;
}

/**
 * The grievance that had been waiting for a reason.
 *
 * Not a new fight — an OLD one, finally spoken. It only fires where resentment
 * already exists, because a drunk argument out of nowhere is a soap opera and a
 * drunk argument about the thing everybody could see coming is Big Brother.
 */
const drunkGrievance = {
  id: 'drinks-grievance',
  category: 'social',
  weight(house, ctx) {
    if (!isDrinksNight(ctx) || !ctx?.week?._drinksOpened) return 0;
    const cast = _grievancePair(house, ctx);
    if (!cast) return 0;
    // Scaled from the threshold rather than from zero. Raising the threshold
    // alone did nothing — in a house of fourteen there is ALWAYS some pair
    // above any constant, and this picks the angriest one, so a flat base
    // weight of 5.5 won the beat nearly every week. What should decide it is
    // how far past ordinary friction this particular grievance has gone.
    return band(1.2 + Math.max(0, cast.heat - 4.5) * 1.1);
  },
  fire(house, ctx, api) {
    const { angry, at, heat } = _grievancePair(house, ctx);
    const p = pronouns(angry);
    const witnesses = _live(house, ctx).filter(n => n !== angry && n !== at).slice(0, 3);

    const text = _variant([
      `${angry} has been carrying this since the ceremony and tonight there is nothing in the way of it. It comes out in the kitchen, at volume, in front of everybody.`,
      `It starts as a joke about ${at} and stops being a joke in the middle of the sentence. ${angry} does not walk it back. Nobody in the room pretends not to have heard.`,
      `${angry} asks ${at} the question ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} been not-asking for a week, and asks it the way ${p.sub} actually ${p.sub === 'they' ? 'mean' : 'means'} it.`,
      `Four days of being fine about it end in about nine seconds. ${at} says ${angry} is drunk. ${angry} says that is not a denial.`,
    ], ctx, angry, at);

    api.addBond(angry, at, -(1.4 + heat * 0.2));
    api.remember(at, angry, 'came-at-me-in-public', 3, { about: 'the night the house drank' });
    api.suspicion(at, angry, 1.1);
    // The room saw it, and a public grievance is information about BOTH of them.
    witnesses.forEach(w => {
      api.suspicion(w, angry, 0.35);
      api.suspicion(w, at, 0.25);
    });
    api.popDelta(angry, isVillainous(angry) ? 1 : -1);

    return {
      text, players: [angry, at, ...witnesses].filter(Boolean),
      badgeText: 'IT COMES OUT', badgeClass: 'red',
    };
  },
};

function _grievancePair(house, ctx) {
  const pool = _live(house, ctx);
  let best = null;
  for (const a of pool) {
    for (const b of pool) {
      if (a === b) continue;
      const heat = resentmentOf(a, b) + (grudge(a, b) ? 2 : 0) + (dislikes(a, b) ? 1.5 : 0);
      // Measured at 2.5 this fired in 30 of 32 weeks, which is not a house
      // with a grievance — it is a house that has a screaming row every single
      // Friday. It should be the week the thing finally boils over, not the
      // weather.
      if (heat < 4.5) continue;
      const score = heat * _looseness(a);
      if (!best || score > best.score) best = { angry: a, at: b, heat, score };
    }
  }
  return best;
}

/**
 * The one who does not drink, and what it buys them.
 *
 * Fires only when somebody genuinely holds back in a room that is not. It is
 * the cheapest strategic move in the house and almost nobody on the real show
 * makes it deliberately, which is exactly why it plays.
 */
const stayedSharp = {
  id: 'drinks-stayed-sharp',
  category: 'social',
  weight(house, ctx) {
    if (!isDrinksNight(ctx) || !ctx?.week?._drinksOpened) return 0;
    const pool = _live(house, ctx);
    if (pool.length < 5) return 0;
    const sober = pool.slice().sort((a, b) => _looseness(a) - _looseness(b))[0];
    // Only worth a card if holding back was a CHOICE rather than a stat — so
    // the room has to be drinking. Measured: gating on a gap to the second most
    // careful houseguest never fired once in 32 weeks, because with a full cast
    // the two most careful people are always within a hair of each other. The
    // question was never "is he the most sober" — it is "is he sober in a room
    // that is not".
    const loose = pool.filter(n => n !== sober && _looseness(n) > 0.5);
    if (!sober || loose.length < 2) return 0;
    if (_looseness(sober) > 0.42) return 0;
    return band(4.5 + (pStats(sober).strategic || 5) * 0.35);
  },
  fire(house, ctx, api) {
    const pool = _live(house, ctx);
    const sober = pool.slice().sort((a, b) => _looseness(a) - _looseness(b))[0];
    const p = pronouns(sober);
    const loose = pool.filter(n => n !== sober && _looseness(n) > 0.5).slice(0, 3);

    const text = _variant([
      `${sober} spends the whole night with the same drink and both ears open. By two in the morning ${p.sub} ${p.sub === 'they' ? 'know' : 'knows'} who is actually working with whom, and nobody knows ${p.sub} ${p.sub === 'they' ? 'were' : 'was'} counting.`,
      `Everybody assumes ${sober} is drinking because ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} holding a cup. ${p.Sub} ${p.sub === 'they' ? 'are' : 'is'} not, and by morning ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} three things ${p.sub} did not have at dinner.`,
      `${sober} tops everybody else up and never ${p.sub === 'they' ? 'their' : 'their'} own glass. It is not subtle if you are watching for it. Nobody is watching for it.`,
      `The best move anybody makes tonight is ${sober} deciding, at about nine o'clock, to stay exactly this sober.`,
    ], ctx, sober);

    // What it buys: a clearer read on everybody who did not hold back.
    loose.forEach(n => {
      api.suspicion(sober, n, -0.4);
      api.remember(sober, n, 'talks-when-drinking', 2, { about: 'the night the house drank' });
    });

    return {
      text, players: [sober, ...loose].filter(Boolean),
      badgeText: 'STAYED SHARP', badgeClass: 'blue',
    };
  },
};

export const DRINKS_EVENTS = [drinksNight, drunkConfession, drunkGrievance, stayedSharp];
