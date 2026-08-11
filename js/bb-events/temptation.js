// ══════════════════════════════════════════════════════════════════════
// bb-events/temptation.js — somebody said yes, and somebody else is paying
// ══════════════════════════════════════════════════════════════════════
//
// The Den's shape is the cruellest in the catalogue: one houseguest is offered
// real power for nothing, the price is paid by a houseguest drawn at random,
// and the house is told a curse landed without ever being told who caused it.
// The twist already models the mechanism and the blame — week.temptation
// carries `guesses`, the house's verdict, right or wrong.
//
// What it did not have was the days around it. A houseguest is sitting in a
// chair nobody chose for them. The room is hunting somebody it cannot find.
// Whoever the room settled on has to keep living here. And the person who
// actually said yes has to look sympathetic about it for a week.
//
// Two rules, both tested.
//
// The ENTRANT is never named as the entrant. Not in text, not in a badge, not
// as "whoever went in". The house knows a curse happened; it does not know a
// Den exists with a specific person's name on it. Everything the family says
// about blame goes through week.temptation.guesses — the room's own verdict,
// which is allowed to be wrong and frequently is.
//
// And the POWER is never named either. The house cannot see what was taken.
import { gs } from '../core.js';
import { pronouns } from '../players.js';
import { pStats, band, perceived, closestTo, furthestFrom, isVillainous, isNice } from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));

const _den = ctx => ctx?.week?.temptation || null;
const _taken = ctx => { const t = _den(ctx); return t && t.accepted ? t : null; };
const _refused = ctx => { const t = _den(ctx); return t && t.accepted === false ? t : null; };
/** Internal casting only — never narrated as the person who went in. */
const _entrant = ctx => _den(ctx)?.entrant || null;
const _guesses = ctx => (_taken(ctx)?.guesses || []).filter(g => g && g.who && g.guess);

// Casting shared by weight() and fire(): a positive weight is a promise.
const _cursedCast = (house, ctx) => {
  const t = _taken(ctx);
  const cursed = t?.cursed;
  if (!cursed || !house.includes(cursed)) return null;
  const witness = closestTo(cursed, _others(house, cursed));
  return { t, cursed, witness };
};
const _huntCast = (house, ctx) => {
  const g = _guesses(ctx).find(x => house.includes(x.who) && house.includes(x.guess) && x.who !== x.guess);
  if (!g) return null;
  const bystander = _others(house, g.who, g.guess)[0] || null;
  return { g, bystander };
};
const _innocentCast = (house, ctx) => {
  const g = _guesses(ctx).find(x => !x.correct && house.includes(x.who) && house.includes(x.guess));
  if (!g) return null;
  const ally = closestTo(g.guess, _others(house, g.guess, g.who));
  return { g, ally };
};
const _debateCast = (house, ctx) => {
  const t = _den(ctx);
  if (!t) return null;
  // The person who actually said yes does not get to be the one loudly
  // announcing they would say yes. It reads as a wink and it IS one: casting
  // them here puts their name in the same breath as accepting, which is the
  // one sentence this family is not allowed to write.
  const pool = _others(house, _entrant(ctx));
  if (pool.length < 2) return null;
  const taker = pool.filter(isVillainous).sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0]
    || [...pool].sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
  const refuser = pool.filter(n => n !== taker && isNice(n))[0]
    || _others(pool, taker).sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
  return taker && refuser && taker !== refuser ? { taker, refuser } : null;
};
const _performCast = (house, ctx) => {
  const t = _taken(ctx);
  const who = _entrant(ctx);
  if (!t || !who || !house.includes(who) || !t.cursed || t.cursed === who) return null;
  const watcher = _others(house, who, t.cursed)
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return watcher ? { t, who, watcher } : null;
};
const _refusedCast = (house, ctx) => {
  const t = _refused(ctx);
  const who = t?.entrant;
  if (!who || !house.includes(who)) return null;
  return { t, who };
};

/** A den that already happened, for the wariness it leaves behind. */
function _lastDen(ctx) {
  const weeks = gs?.bb?.weeks || [];
  const now = ctx?.week?.num || 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const w = weeks[i];
    if (w && w.num < now && w.temptation?.accepted && w.temptation.cursed) return w;
  }
  return null;
}
const _afterCast = (house, ctx) => {
  const last = _lastDen(ctx);
  const cursed = last?.temptation?.cursed;
  if (!cursed || !house.includes(cursed) || _den(ctx)) return null;
  const wary = _others(house, cursed).sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return wary ? { cursed, wary } : null;
};

// ── the chair nobody chose ────────────────────────────────────────────
const carriesIt = {
  id: 'temptation-carries-it',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _cursedCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _cursedCast(house, ctx);
    if (!cast) return null;
    const { cursed, witness } = cast;
    const p = pronouns(cursed);
    const st = pStats(cursed);
    // A volatile houseguest does not take this quietly; a composed one banks
    // it, which is worse for everybody later.
    const loud = st.temperament <= 5;
    const text = loud ? _variant([
      `${cursed} has been nominated by nobody, for nothing, and wants that stated out loud in every room ${p.sub} ${p.sub === 'they' ? 'walk' : 'walks'} into. "I didn't lose anything. I wasn't even PLAYING."`,
      `"Somebody in this house got a present and I got the bill." ${cursed} is not wrong and is not being quiet about it${witness ? `. ${witness} agrees with every word and stays carefully out of the splash` : ''}.`,
      `${cursed} kicks a cupboard door, apologises to the cupboard, and goes back to explaining to the kitchen that ${p.sub} ${p.sub === 'they' ? 'were' : 'was'} nominated by a coin toss.`,
    ], ctx, cursed) : _variant([
      `${cursed} takes the chair without arguing about it, which everybody notices, and files the whole thing somewhere it can be got at later.`,
      `"It's fine. It's the game." ${cursed} says it twice, evenly, and ${witness || 'the room'} can tell it is not filed under fine.`,
      `${cursed} does the maths in public — nominated by nobody, saved by nobody, owed by everybody — and then lets it go, in the way that means the opposite of letting it go.`,
    ], ctx, cursed);
    // Being cursed is sympathy, and sympathy is a resource.
    api.popDelta(cursed, 1);
    if (witness) api.addBond(cursed, witness, 0.4);
    return { text, players: [cursed, witness].filter(Boolean),
      badgeText: loud ? 'NOMINATED BY NOBODY' : 'BANKING IT', badgeClass: loud ? 'red' : 'grey' };
  },
};

// ── the hunt ──────────────────────────────────────────────────────────
const hunting = {
  id: 'temptation-hunting',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _huntCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _huntCast(house, ctx);
    if (!cast) return null;
    const { g, bystander } = cast;
    const text = _variant([
      `${g.who} works the room on the only question that matters: who came out of this week with something. The answer ${g.who} arrives at is ${g.guess}, and ${g.who} says it in enough rooms that it stops needing a source.`,
      `"Somebody agreed to this." ${g.who} keeps saying it, and every time ${g.who} says it, ${g.guess}'s name is a little closer to the end of the sentence.`,
      `${g.who} has built a timeline out of who was where and who was quiet, and it points at ${g.guess}. ${bystander ? `${bystander} is told the theory twice before lunch.` : 'The theory is going round without a single fact in it.'}`,
      `${g.who} cannot find the person who did this, so ${g.who} settles for the person who looks most like they would have. That person is ${g.guess}.`,
    ], ctx, g.who, g.guess);
    api.suspicion(g.who, g.guess, 1.2);
    if (bystander) api.suspicion(bystander, g.guess, 0.5);
    return { text, players: [g.who, g.guess, bystander].filter(Boolean),
      badgeText: g.correct ? 'CLOSING IN' : 'THE WRONG NAME',
      badgeClass: g.correct ? 'gold' : 'red' };
  },
};

// ── the innocent, paying ──────────────────────────────────────────────
const innocentPays = {
  id: 'temptation-innocent-pays',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _innocentCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _innocentCast(house, ctx);
    if (!cast) return null;
    const { g, ally } = cast;
    const p = pronouns(g.guess);
    const text = _variant([
      `${g.guess} did not go anywhere, take anything or agree to anything, and has spent two days being the person who did. There is no way to prove a thing you did not do${ally ? `, which ${ally} points out is the worst possible position to be in` : ''}.`,
      `"I would tell you if it was me. It would be a good move. I'd be BRAGGING." ${g.guess} makes the argument well and it changes nothing, because ${g.who} has already decided.`,
      `${g.guess} asks ${g.who} directly what evidence there is. ${g.who} lists three things that are not evidence. ${p.Sub} ${p.sub === 'they' ? 'stop' : 'stops'} asking after that.`,
      `The story that ${g.guess} took something has stopped being a theory and started being a fact about ${p.obj}, and nobody can remember who said it first.`,
    ], ctx, g.guess, g.who);
    api.addBond(g.guess, g.who, -0.9);
    try { api.remember(g.guess, g.who, 'grudge', 2, { twist: 'bb-den-of-temptation', accusedOf: 'the curse' }); } catch { /* texture */ }
    if (ally) api.addBond(g.guess, ally, 0.5);
    return { text, players: [g.guess, g.who, ally].filter(Boolean),
      badgeText: 'GUILTY OF NOTHING', badgeClass: 'red' };
  },
};

// ── would you have taken it ───────────────────────────────────────────
const wouldYouTake = {
  id: 'temptation-would-you-take-it',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _debateCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _debateCast(house, ctx);
    if (!cast) return null;
    const { taker, refuser } = cast;
    const text = _variant([
      `The kitchen runs the hypothetical: would you take it, knowing somebody else pays. ${taker} says yes before the question is finished. ${refuser} says no, and means it, and the room notes both answers.`,
      `"It's not even a decision. Somebody was always going to pay, it just wasn't going to be me." ${taker} is arguing about a thing ${taker} was not offered, with the conviction of somebody who would have been.`,
      `${refuser} says the price is the problem — that you have to look at whoever draws the short straw every day afterwards. ${taker} points out that you have to look at everybody every day anyway.`,
      `Nobody in this conversation was in the Den and everybody in it is telling the room exactly what they would have done. ${taker} and ${refuser} have now both been heard.`,
    ], ctx, taker, refuser);
    // Saying you would take it is a thing the house remembers about you.
    api.suspicion(refuser, taker, 0.8);
    api.popDelta(taker, 0.5);
    api.addBond(taker, refuser, -0.3);
    return { text, players: [taker, refuser], badgeText: 'WOULD YOU TAKE IT', badgeClass: 'grey' };
  },
};

// ── the one who said yes, being sorry about it ────────────────────────
const performingSympathy = {
  id: 'temptation-performing-sympathy',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _performCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _performCast(house, ctx);
    if (!cast) return null;
    const { t, who, watcher } = cast;
    const st = pStats(who);
    // The tell is doing too much for the person you put in that chair.
    const overplayed = pStats(watcher).intuition >= 7 && st.strategic <= 6;
    const p = pronouns(who);
    const text = overplayed ? _variant([
      `${who} is the most upset person in this house about ${t.cursed}'s week, and ${who} was not nominated, not involved and not asked. ${watcher} watches ${p.obj} be upset and starts counting.`,
      `${who} has brought ${t.cursed} tea twice, sat with ${p.obj} through the worst of it and told three separate people how unfair it is. It is all genuine. ${watcher} still thinks it is a lot.`,
      `${watcher} notices that ${who} keeps saying "whoever did this" with real feeling, and that people who did nothing usually just say "weird week".`,
    ], ctx, who, watcher) : _variant([
      `${who} is sympathetic about ${t.cursed}'s chair in exactly the way everybody else is: briefly, and then about something else. Nobody looks twice.`,
      `${who} says the right amount about the curse — which is not much — and spends the rest of the day being visibly uninterested in where it came from.`,
      `Somebody asks ${who} who ${p.sub} ${p.sub === 'they' ? 'think' : 'thinks'} took it. ${p.Sub} ${p.sub === 'they' ? 'name' : 'names'} somebody plausible, shrug, and the conversation moves past ${p.obj}.`,
    ], ctx, who, watcher);
    if (overplayed) {
      api.suspicion(watcher, who, 1.5);
      try { api.remember(watcher, who, 'suspected-the-den', 1, { twist: 'bb-den-of-temptation', correct: true }); } catch { /* texture */ }
    }
    return { text, players: [who, watcher],
      badgeText: overplayed ? 'A LOT OF SYMPATHY' : 'NOTHING TO SEE',
      badgeClass: overplayed ? 'gold' : 'grey' };
  },
};

// ── the offer nobody knows was refused ────────────────────────────────
const refusedIt = {
  id: 'temptation-refused',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _refusedCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _refusedCast(house, ctx);
    if (!cast) return null;
    const { who } = cast;
    const p = pronouns(who);
    const confidant = closestTo(who, _others(house, who));
    const text = _variant([
      `Nothing happened this week, as far as this house is concerned. ${who} is the only person in it who knows that is a sentence with a decision inside it.`,
      `${who} was offered something for free, worked out who would have paid for it, and said no. Nobody will ever thank ${p.obj}, because nobody will ever know.`,
      `${who} keeps almost telling ${confidant || 'somebody'} about the offer and stopping, because the only way to explain saying no is to admit ${p.sub} ${p.sub === 'they' ? 'were' : 'was'} asked.`,
      `${who} spends the evening quietly re-deciding something ${p.sub} already decided, and arriving at the same answer, and being slightly less sure of it each time.`,
    ], ctx, who);
    // Nothing public happens. What changes is what they think of themselves.
    api.popDelta(who, 0.5);
    return { text, players: [who], badgeText: 'NOBODY WILL EVER KNOW', badgeClass: 'blue' };
  },
};

// ── the week after ────────────────────────────────────────────────────
const afterwards = {
  id: 'temptation-afterwards',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _afterCast(house, ctx) ? band(7, 11) : 0;
  },
  fire(house, ctx, api) {
    const cast = _afterCast(house, ctx);
    if (!cast) return null;
    const { cursed, wary } = cast;
    const text = _variant([
      `${wary} has drawn the obvious conclusion from ${cursed}'s week: things get handed out in this house that somebody else pays for, and there is no reason to think it happened only once.`,
      `Nobody has forgotten that ${cursed} sat in a chair nobody chose. It has changed how this house hears the word "offer".`,
      `${wary} points out, to nobody in particular, that whoever took it is still here and still holding it. The room does not enjoy that thought and does not disagree with it either.`,
      `${cursed}'s week has become the reason this house is suspicious of good news, which is a thing one anonymous decision managed to do to nine people.`,
    ], ctx, cursed, wary);
    api.popDelta(cursed, 0.5);
    return { text, players: [wary, cursed], badgeText: 'STILL HOLDING IT', badgeClass: 'grey' };
  },
};

export const TEMPTATION_EVENTS = [
  carriesIt, hunting, innocentPays, wouldYouTake,
  performingSympathy, refusedIt, afterwards,
];
