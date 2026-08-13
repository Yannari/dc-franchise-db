// ══════════════════════════════════════════════════════════════════════
// bb-events/invisible.js — the week nobody signed
// ══════════════════════════════════════════════════════════════════════
//
// On an Invisible HOH week the entire power-hoh family goes silent — there
// is no public HOH room, no pitch queue, no court to hold — which left a
// hole exactly where the format's paranoia should be. These events are that
// paranoia: the sofa symposium about who did it, the direct accusation that
// may ruin an innocent friendship, the bold liar taking credit for a
// nomination they never made, and the real winner performing innocence one
// notch too loudly for the sharpest person in the room.
//
// Rules of the family: every event is gated on ctx.week.hohSecret; the text
// may show the real HOH DOING things (speculating, deflecting — the house
// sees a person, not a title) but may never narrate them as the HOH; and
// every guess, right or wrong, has consequences — that is the whole twist.
import { pronouns } from '../players.js';
import {
  pStats, band, perceived, furthestFrom, isVillainous,
} from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _sealed = ctx => !!ctx?.week?.hohSecret;
const _realHoh = ctx => ctx?.week?.hoh || null;   // internal casting only — never narrated as HOH
const _nominees = ctx => (ctx?.nominees || ctx?.week?.initialNominees || []).filter(Boolean);

/** A deterministic pick that varies by week and salt, without Math.random. */
function _pick(list, ctx, ...salt) {
  if (!list.length) return null;
  const key = `${ctx?.week?.num || 0}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

// ── the sofa symposium ────────────────────────────────────────────────
const whodunitCircle = {
  id: 'invisible-whodunit-circle',
  category: 'invisible',
  weight(house, ctx) {
    if (!_sealed(ctx) || ctx.act !== 'house') return 0;
    return band(9, 14);
  },
  fire(house, ctx, api) {
    const noms = _nominees(ctx);
    const pool = _others(house, ...noms);
    if (pool.length < 3) return null;
    const talkers = pool.slice(0, 4);
    // The name the room floats: whoever the group collectively trusts least —
    // which is a read of the ROOM, not of the truth, and is often wrong.
    const accused = _pick(pool.filter(n => !talkers.slice(0, 2).includes(n))
      .sort((a, b) => (perceived(talkers[0], a) ?? 0) - (perceived(talkers[0], b) ?? 0)).slice(0, 2), ctx, 'accused');
    if (!accused) return null;
    const right = accused === _realHoh(ctx);
    const text = _variant([
      `The sofas hold a symposium on the only subject in the house. Motives are listed, alibis are compared, and by the second lap the name that keeps surfacing is ${accused} — who ${right ? 'keeps their face very, very still' : 'is not even in the room to defend themselves'}.`,
      `${talkers[0]} asks everyone who had the clearest reason to nominate the two people on the block. Motives and alibis get picked apart until the group settles on ${accused}.`,
      `The group retraces nomination morning, looking for anyone who disappeared or seemed to know the result early. Several weak clues get combined into one confident accusation against ${accused}.`,
      `${talkers[1] || talkers[0]} draws the week on the back of a cereal box: who was where, who said what, who smiled wrong. The diagram points at ${accused}, mostly because diagrams have to point somewhere.`,
    ], ctx, accused);
    // The room's suspicion is a real force, aimed by consensus — at whoever
    // it lands on, deserved or not.
    talkers.forEach(t => { if (t !== accused) api.suspicion(t, accused, 0.5); });
    return { text, players: [...talkers.slice(0, 3), accused].filter((n, i, a) => a.indexOf(n) === i),
      badgeText: right ? 'CLOSING IN' : 'WRONG SCENT', badgeClass: right ? 'gold' : 'grey' };
  },
};

// ── the direct accusation ─────────────────────────────────────────────
const wrongAccusation = {
  id: 'invisible-accusation',
  category: 'invisible',
  weight(house, ctx) {
    if (!_sealed(ctx) || ctx.act !== 'house') return 0;
    return band(7, 12);
  },
  fire(house, ctx, api) {
    const noms = _nominees(ctx);
    const pool = _others(house, ...noms);
    // The hottest head among the non-nominees pulls the trigger.
    const accuser = [...pool].sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
    if (!accuser) return null;
    const correct = pStats(accuser).intuition >= 7 && _realHoh(ctx) && _realHoh(ctx) !== accuser;
    const accused = correct ? _realHoh(ctx)
      : furthestFrom(accuser, pool.filter(n => n !== accuser && n !== _realHoh(ctx))) || null;
    if (!accused) return null;
    const p = pronouns(accused);
    const text = _variant([
      `${accuser} stops pretending to wonder and says it to ${accused}'s face: "It was you." ${accused} ${correct ? `denies it with exactly the right amount of outrage, which takes practice` : `denies it with the specific exhaustion of somebody telling the truth to a person who has decided not to hear it`}.`,
      `${accuser} corners ${accused} by the fridge with a list of evidence that is really a list of feelings. ${p.Sub} ${p.sub === 'they' ? 'deny' : 'denies'} all of it.`,
      `"Just admit it and I'll respect you more." ${accuser} says it like an offer. ${accused} declines the offer, because ${correct ? 'accepting it would be a confession' : 'there is nothing to confess'}.`,
      `${accuser} tells the kitchen that ${accused} is the Invisible HOH and claims the nominations prove it. ${accused} denies making them, but ${accuser} repeats the accusation in front of everyone until the room is forced to take sides.`,
    ], ctx, accuser, accused);
    api.addBond(accuser, accused, -0.7);
    api.suspicion(accuser, accused, 1.2);
    try { api.remember(accused, accuser, 'grudge', 1, { act: 'house', invisibleWeek: true }); } catch { /* texture */ }
    return { text, players: [accuser, accused],
      badgeText: correct ? 'DEAD ON' : 'THE WRONG DOOR', badgeClass: correct ? 'gold' : 'red' };
  },
};

// ── taking credit for someone else's nomination ───────────────────────
const falseCredit = {
  id: 'invisible-false-credit',
  category: 'invisible',
  weight(house, ctx) {
    if (!_sealed(ctx) || ctx.act !== 'house') return 0;
    // Only a villain with nerve claims a move they never made.
    const pool = _others(house, ..._nominees(ctx)).filter(n => n !== _realHoh(ctx)
      && isVillainous(n) && pStats(n).boldness >= 6);
    return pool.length ? band(6, 10) : 0;
  },
  fire(house, ctx, api) {
    const pool = _others(house, ..._nominees(ctx)).filter(n => n !== _realHoh(ctx)
      && isVillainous(n) && pStats(n).boldness >= 6);
    const liar = _pick(pool, ctx, 'liar');
    if (!liar) return null;
    const audience = _pick(_others(house, liar, ..._nominees(ctx)), ctx, 'audience');
    if (!audience) return null;
    const p = pronouns(liar);
    const text = _variant([
      `${liar} hints to ${audience} that ${p.sub} secretly won HOH. "Some moves are better made quietly," ${p.sub} says while looking at the nominees on the memory wall. ${audience} leaves believing ${liar} made the nominations.`,
      `"All I'll say is: the block looks exactly how I wanted it to look." ${liar} lets ${audience} carry that to the rest of the house, which was the entire point of saying it.`,
      `${liar} shrugs at ${audience}: "People keep asking who did it. Nobody's asked who BENEFITS." ${p.Sub} ${p.sub === 'they' ? 'are' : 'is'} claiming a nomination ${p.sub} never made, one raised eyebrow at a time.`,
      `${liar} tells ${audience}, in confidence, to "watch what happens at the veto". Nothing ${liar} predicted will happen, but by then the legend will have lapped the facts.`,
    ], ctx, liar, audience);
    // Claiming power buys fear and costs safety: the room starts treating the
    // liar as armed, which is respect right up until it is a target.
    api.suspicion(audience, liar, 1.4);
    api.popDelta(liar, 1);
    try { api.remember(audience, liar, 'claimed-the-nomination', 1, { invisibleWeek: true }); } catch { /* texture */ }
    return { text, players: [liar, audience], badgeText: 'TAKING CREDIT', badgeClass: 'red' };
  },
};

// ── the winner performs innocence ─────────────────────────────────────
const performedInnocence = {
  id: 'invisible-performed-innocence',
  category: 'invisible',
  weight(house, ctx) {
    if (!_sealed(ctx) || ctx.act !== 'house') return 0;
    return _realHoh(ctx) && (ctx.phase === 'post-noms' || ctx.phase === 'post-veto') ? band(8, 13) : 0;
  },
  fire(house, ctx, api) {
    const hoh = _realHoh(ctx);
    const noms = _nominees(ctx);
    if (!hoh || !house.includes(hoh)) return null;
    // The sharpest audience member is the danger.
    const watcher = _others(house, hoh, ...noms)
      .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
    if (!watcher) return null;
    const st = pStats(hoh);
    const overplayed = pStats(watcher).intuition >= 7 && st.strategic <= 6;
    const p = pronouns(hoh);
    const text = overplayed ? _variant([
      `${hoh} speculates about the nominations a little too fluently — theories with suspects, motives, a timeline. ${watcher} listens and thinks: nobody innocent has done this much homework.`,
      `${hoh} is the loudest voice in the whodunit conversation, which ${watcher} notices is also the cheapest place to hide. ${p.Sub} ${p.sub === 'they' ? 'are' : 'is'} not hiding it well.`,
      `${hoh} keeps answering every theory with "but who do YOU think it was?" ${watcher} notices how often ${p.sub} redirects the question and starts wondering what ${p.sub} is steering away from.`,
      `${watcher} invents a false detail about how the secret HOH submitted the nominations. Everyone looks confused except ${hoh}, who is careful not to react. That restraint makes ${watcher} suspicious.`,
    ], ctx, hoh, watcher) : _variant([
      `${hoh} complains about the mystery exactly as much as everybody else — no more, no less — and joins the wrong theory with real enthusiasm. It is a flawless performance, and nobody claps.`,
      `${hoh} loudly endorses the room's favourite suspect, adds one supporting detail, and changes the subject at the correct speed. The week stays sealed.`,
      `Somebody asks ${hoh} directly. ${p.Sub} ${p.sub === 'they' ? 'laugh' : 'laughs'}, ${p.sub === 'they' ? 'name' : 'names'} a suspect of ${p.posAdj} own, and the conversation moves on past ${p.obj} like water past a stone.`,
      `${hoh} spends the afternoon visibly, publicly bad at solving the mystery ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} the answer to.`,
    ], ctx, hoh, watcher);
    if (overplayed) {
      // The slip is a real clue: the watcher's suspicion lands on the truth.
      api.suspicion(watcher, hoh, 1.6);
      try { api.remember(watcher, hoh, 'suspected-invisible-hoh', 1, { invisibleWeek: true }); } catch { /* texture */ }
    }
    return { text, players: [hoh, watcher],
      badgeText: overplayed ? 'ONE NOTCH TOO LOUD' : 'FLAWLESS ALIBI',
      badgeClass: overplayed ? 'gold' : 'grey' };
  },
};

// ── the alibi pact ────────────────────────────────────────────────────
const alibiPact = {
  id: 'invisible-alibi-pact',
  category: 'invisible',
  weight(house, ctx) {
    if (!_sealed(ctx) || ctx.act !== 'house') return 0;
    return band(6, 10);
  },
  fire(house, ctx, api) {
    const noms = _nominees(ctx);
    const pool = _others(house, ...noms);
    const a = _pick(pool, ctx, 'alibi-a');
    if (!a) return null;
    const b = pool.filter(n => n !== a).sort((x, y) => (perceived(a, y) ?? 0) - (perceived(a, x) ?? 0))[0];
    if (!b) return null;
    const text = _variant([
      `${a} and ${b} compare where they were before the anonymous nominations appeared. Neither remembers the entire morning, so they agree to say they were together if either is accused of being the Invisible HOH.`,
      `"You vouch for me, I vouch for you." ${a} and ${b} shake on a shared alibi. Neither asks whether the other is telling the truth.`,
      `${a} and ${b} rehearse the same account of nomination morning: the kitchen first, then the backyard, always together. By the third correction, it sounds rehearsed because it is.`,
      `${a} tells the room that ${b} could not be the Invisible HOH because they spent nomination morning together. ${b} immediately returns the favour, drawing new suspicion to both of them.`,
    ], ctx, a, b);
    api.addBond(a, b, 0.5);
    return { text, players: [a, b], badgeText: 'THE ALIBI PACT', badgeClass: 'blue' };
  },
};

// ── a nominee works their theory ──────────────────────────────────────
const nomineeDetective = {
  id: 'invisible-nominee-detective',
  category: 'invisible',
  weight(house, ctx) {
    if (!_sealed(ctx) || ctx.act !== 'house') return 0;
    return (_nominees(ctx).length && (ctx.week?.hohGuesses || []).length) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const guesses = ctx.week?.hohGuesses || [];
    const entry = _pick(guesses.filter(g => house.includes(g.who) && house.includes(g.guess)), ctx, 'detective');
    if (!entry) return null;
    const { who, guess, correct } = entry;
    const confidant = _others(house, who, guess, ..._nominees(ctx))[0];
    const p = pronouns(who);
    const text = _variant([
      `${who} has stopped asking "who did this" and started asking "how do I prove it was ${guess}". ${confidant ? `${confidant} gets the whole theory, with exhibits.` : `The theory now has exhibits.`}`,
      `${who} watches ${guess} across the kitchen the way you watch a word you cannot quite remember. ${correct ? 'The word is right there.' : 'The word is not, in fact, there.'}`,
      `${who} falsely claims to know when the secret HOH submitted the nominations, hoping ${guess} will correct the detail or reveal something only the winner would know. The reaction is ambiguous, but ${who} takes it as confirmation.`,
      `${who} recruits ${confidant || 'half the kitchen'} into the case against ${guess}. Certainty, it turns out, is contagious — and ${correct ? 'this time it happens to be true' : 'accuracy is not what it spreads'}.`,
    ], ctx, who, guess);
    api.suspicion(who, guess, 0.8);
    if (confidant) api.suspicion(confidant, guess, 0.4);
    return { text, players: [who, guess, confidant].filter(Boolean),
      badgeText: correct ? 'ON THE TRAIL' : 'A BEAUTIFUL WRONG THEORY',
      badgeClass: correct ? 'gold' : 'red' };
  },
};

export const INVISIBLE_EVENTS = [
  whodunitCircle, wrongAccusation, falseCredit,
  performedInnocence, alibiPact, nomineeDetective,
];
