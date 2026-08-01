// ══════════════════════════════════════════════════════════════════════
// bb-events/ceremonies.js — nomination and veto ceremony house events
// ══════════════════════════════════════════════════════════════════════
//
// The first slice of the Big Brother event library. The scheduler and the state
// API belong to js/bb/house-events.js; only the events themselves live here.
//
// Every event is `{ id, category, weight(house, ctx), fire(house, ctx, api) }`.
// `weight` returns 0 for "cannot happen this beat" and otherwise a proportional
// score — never a threshold, exactly as Total Drama scores its own events.
// `fire` returns a beat and may change the world ONLY through `api`, so the
// engine keeps ownership of its state.
//
// Two deliberate choices worth knowing before adding to this file:
//
//   * Text is picked DETERMINISTICALLY, not randomly. `fire()` is handed no rng,
//     and reaching for Math.random would make a seeded season stop reproducing —
//     which the engine's own tests rely on. `_variant` derives its choice from
//     the week, the beat and the players involved instead: varied across a
//     season, identical when the same seed is replayed.
//   * Only acts the scheduler actually visits are covered. Eviction is not one
//     of them yet (js/bb/week.js hardcodes `socialBeats: []` there), so farewell
//     speeches are not written here — they would be dead code.

import { housePlan } from '../bb/plans.js';
import { pronouns } from '../players.js';
import {
  pStats, bond, perceived, band, bondFactor, sharesAlliance, trusts, dislikes, actFacts,
  wasPromised, remembers, grudge, suspicionOf, willScheme, isVillainous, archetype, targetOf,
} from './_read.js';

// ── helpers ───────────────────────────────────────────────────────────

// Stable across replays of the same seed, different across a season. Mixing the
// player names in is what stops every week's nomination speech reading alike.
function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

function _nominees(ctx) {
  return (ctx?.nominees || []).filter(Boolean);
}

const holderOf = ctx => ctx?.vetoWinner || null;

// The nominee the veto could have saved and did not. Picked by who had most
// reason to expect saving, not by a stat.
function _strandedNominee(ctx) {
  const holder = holderOf(ctx);
  return _nominees(ctx).filter(n => n !== holder)
    .sort((a, b) => bond(b, holder) - bond(a, holder))[0] || null;
}

const _bystanders = (house, ctx, ...exclude) =>
  house.filter(n => n !== ctx?.hoh && !_nominees(ctx).includes(n) && !exclude.includes(n));

// ── nominations ───────────────────────────────────────────────────────

const nomSpeechGame = {
  id: 'nom-speech-game',
  category: 'ceremonies',
  weight(house, ctx) {
    if (ctx.act !== 'nominations' || !ctx.hoh || _nominees(ctx).length < 2) return 0;
    const s = pStats(ctx.hoh);
    // A composed, strategic HOH is the one who keeps it about the game — but
    // with a floor, because a product of two normalised stats is a trap. An
    // average Head of Household scores 5/10 x 5/10 x 9 = 2.25 against siblings
    // sitting near 9, so this only ever fired for the rare houseguest who is
    // high in both, and turned up twice in ten seasons. nom-speech-personal had
    // exactly this shape and exactly this problem. Keeping a nomination speech
    // about the game is the ordinary case, not a special talent.
    return 3.5 + (s.strategic / 10) * (s.temperament / 10) * 7;
  },
  fire(house, ctx, api) {
    const [a, b] = _nominees(ctx);
    const p = pronouns(ctx.hoh);
    const text = _variant([
      `${ctx.hoh} keeps the ceremony short. "${a}, ${b} — this is not personal, and I'm not going to insult either of you by pretending it was hard." Nobody in the room believes the second half.`,
      `“I want to be clear,” ${ctx.hoh} says while turning the key. “${a}, ${b}, this is about where the numbers are. It isn't personal.” Several people avoid looking at the nominees.`,
      `${ctx.hoh} names ${a} and ${b}, closes the box and sits down. There is no long speech and no apology. The room stays quiet.`,
      `"${a}. ${b}." ${ctx.hoh} sets the keys down. "You'll both have a shot at the veto and I'd rather one of you take yourself off than have me explain myself twice." It lands as fair. It is also, precisely, a plan.`,
    ], ctx, ctx.hoh, a, b);

    // Composure reads as competence, and competence is a target.
    api.popDelta(ctx.hoh, 1);
    _bystanders(house, ctx).forEach(watcher => {
      if (pStats(watcher).intuition >= 6) api.suspicion(watcher, ctx.hoh, 0.6);
    });
    api.addBond(ctx.hoh, a, -0.3);
    api.addBond(ctx.hoh, b, -0.3);
    return { text, players: [ctx.hoh, a, b], badgeText: 'NOMINATIONS', badgeClass: 'blue' };
  },
};

const nomSpeechPersonal = {
  id: 'nom-speech-personal',
  category: 'ceremonies',
  weight(house, ctx) {
    if (ctx.act !== 'nominations' || !ctx.hoh || _nominees(ctx).length < 2) return 0;
    const s = pStats(ctx.hoh);
    // Hot tempers and villains make it personal; the composed rarely do — and a
    // standing grudge or an existing target turns the temperature up further.
    // A product of two normalised stats collapses fast: a composed, cautious
    // Head of Household scores about 0.08 here, and after band() that is
    // nothing at all — so in a cast that never hands power to a hothead this
    // event simply never happens. It has now gone dark twice for that reason.
    //
    // A grudge sets a floor. Somebody calm with a real grievance can still call
    // a person out at the ceremony; being even-tempered is not the same as
    // having nothing to say.
    const grudged = grudge(ctx.hoh, ctx.target || _nominees(ctx)[0]) >= 2
      || (housePlan(ctx.hoh)?.revenge || []).includes(ctx.target || _nominees(ctx)[0]);
    const heat = Math.max(grudged ? 0.34 : 0.06,
      ((10 - s.temperament) / 10) * (s.boldness / 10));
    const nasty = isVillainous(ctx.hoh) || archetype(ctx.hoh) === 'hothead' ? 11 : 4;
    const target = ctx.target && _nominees(ctx).includes(ctx.target) ? ctx.target : _nominees(ctx)[0];
    const bad = dislikes(ctx.hoh, target) ? 1.6 : 1;
    const owed = grudge(ctx.hoh, target) >= 2 ? 1.5 : 1;
    // Nominations follow a plan now, which pulls the block toward strategic
    // threats rather than people the Head of Household happens to dislike — and
    // that quietly starved this event out of a measured season entirely. But
    // the plan is also where a grudge is written down: somebody on the revenge
    // list is the likeliest person in the house to get a speech about it.
    const personal = (housePlan(ctx.hoh)?.revenge || []).includes(target) ? 2.2 : 1;
    return band(heat * nasty * bad * owed * personal);
  },
  fire(house, ctx, api) {
    const target = ctx.target && _nominees(ctx).includes(ctx.target) ? ctx.target : _nominees(ctx)[0];
    const other = _nominees(ctx).find(n => n !== target) || _nominees(ctx)[1];
    const p = pronouns(ctx.hoh);
    const text = _variant([
      `${ctx.hoh} does not keep it civil. "${target}, you've been running your mouth about me since we moved in, and you thought I wasn't hearing it." The room goes very still. ${other} stares at the floor, grateful and ashamed of being grateful.`,
      `"People keep telling me to say it's just a game," ${ctx.hoh} says. "It isn't. ${target}, this one's personal." ${p.Sub} doesn't sit back down so much as drop into the chair, and half the house quietly moves ${p.posAdj} name up their list.`,
      `${ctx.hoh} gets through ${target}'s nomination and then keeps going, three sentences past where the speech should have ended. By the last one ${other} has stopped looking relieved and started looking worried about the precedent.`,
      `"I'm not going to lie to your face the way you lied to mine," ${ctx.hoh} tells ${target}. It is satisfying. It is also the moment ${p.sub} stops being an HOH with a plan and becomes an HOH with an enemy.`,
    ], ctx, ctx.hoh, target);

    // A personal nomination buys a grudge and costs standing.
    api.addBond(ctx.hoh, target, -1.6);
    api.setTarget(target, ctx.hoh, 'named me personally at the ceremony');
    api.remember(target, ctx.hoh, 'humiliation', 2, { act: 'nominations' });
    api.popDelta(ctx.hoh, -1);
    _bystanders(house, ctx).forEach(watcher => api.suspicion(watcher, ctx.hoh, 0.4));
    return { text, players: [ctx.hoh, target, other].filter(Boolean), badgeText: 'MADE IT PERSONAL', badgeClass: 'red' };
  },
};

const nomPawnReassured = {
  id: 'nom-pawn-reassured',
  category: 'ceremonies',
  weight(house, ctx) {
    if (ctx.act !== 'nominations' || !ctx.hoh) return 0;
    const { pawn } = actFacts(ctx);
    if (!pawn || !_nominees(ctx).includes(pawn)) return 0;
    const s = pStats(ctx.hoh);
    // You only bother reassuring a pawn you have some relationship with — and
    // you try hardest when they have reason to doubt you already.
    const rapport = bondFactor(bond(ctx.hoh, pawn));
    const doubted = suspicionOf(pawn, ctx.hoh) > 2 ? 1.4 : 1;
    return band((s.social / 10) * (s.strategic / 10) * rapport * doubted * 16);
  },
  fire(house, ctx, api) {
    const { pawn } = actFacts(ctx);
    const p = pronouns(pawn);
    // A schemer's reassurance is worth less, and a pawn who already remembers a
    // broken promise from this person believes almost none of it.
    const honest = !willScheme(ctx.hoh);
    const burnedBefore = remembers(pawn, ctx.hoh, 'betrayal') || grudge(pawn, ctx.hoh) >= 2;
    const wary = suspicionOf(pawn, ctx.hoh);
    const text = _variant([
      `${ctx.hoh} finds ${pawn} in the storage room within the hour. "You're not the one going. I need you up there until the vote, and I need you to trust me." ${pawn} says yes. ${p.Sub} means it, mostly.`,
      `"Say it to my face," ${pawn} says. ${ctx.hoh} does: "You are a pawn. You are safe. If that changes you'll hear it from me before you hear it from anyone else." It is the exact sentence every pawn in the history of this house has been told.`,
      `${ctx.hoh} catches ${pawn} on the stairs and talks fast and low. ${pawn} nods along, and only afterwards, alone, works out that ${p.sub} never actually got a number — just a tone.`,
      `While they wash dishes, ${ctx.hoh} tells ${pawn}, “You stay through the vote, then you're off the block and we never do this again.” ${pawn} asks whether the votes are really there.`,
      ...(burnedBefore ? [`"You told me something like this before," ${pawn} says. ${ctx.hoh} does not have a good answer, and the pause where the answer should be is the whole conversation. ${pawn} agrees anyway, because on the block there is nothing else to agree to.`] : []),
    ], ctx, ctx.hoh, pawn);

    // A reassurance is worth what the relationship behind it is worth. Someone
    // already burned by this person takes almost nothing from it.
    const believed = Math.max(0.15, (honest ? 1 : 0.6) * (burnedBefore ? 0.3 : 1) * (1 - Math.min(0.6, wary / 12)));
    api.addBond(ctx.hoh, pawn, 1.2 * believed);
    // The promise goes on the record either way — that is what makes breaking it
    // cost something later, at the veto ceremony or at the vote.
    api.remember(pawn, ctx.hoh, 'promise', honest ? 1 : 2, { promise: 'you are only a pawn', believed: Math.round(believed * 100) / 100 });
    if (!honest || burnedBefore) api.suspicion(pawn, ctx.hoh, burnedBefore ? 1.2 : 0.8);
    return {
      text, players: [ctx.hoh, pawn],
      badgeText: burnedBefore ? 'PAWN DEAL · DOUBTED' : 'PAWN DEAL',
      badgeClass: burnedBefore ? 'grey' : 'green',
    };
  },
};

// A blindside is not a stat. It is trust, betrayed — and it hurts in proportion
// to how much trust there was, how loudly it had been promised, and whether the
// house could see the alliance that just broke.
function _blindsideVictim(ctx) {
  const week = ctx?.week?.num || 0;
  return _nominees(ctx)
    .filter(n => trusts(n, ctx.hoh, 2.5) || wasPromised(n, ctx.hoh, week) || sharesAlliance(n, ctx.hoh))
    .sort((a, b) => bond(b, ctx.hoh) - bond(a, ctx.hoh))[0] || null;
}

const nomBlindside = {
  id: 'nom-blindside',
  category: 'ceremonies',
  weight(house, ctx) {
    if (ctx.act !== 'nominations' || !ctx.hoh) return 0;
    const victim = _blindsideVictim(ctx);
    if (!victim) return 0;
    // Depth of the betrayal: the bond itself, plus a promise on record, plus a
    // standing alliance. All proportional — a mild friendship barely registers.
    const closeness = bondFactor(bond(victim, ctx.hoh));
    const promised = wasPromised(victim, ctx.hoh, ctx?.week?.num || 0) ? 1.4 : 1;
    const allied = sharesAlliance(victim, ctx.hoh) ? 1.5 : 1;
    return band(closeness * promised * allied * 12);
  },
  fire(house, ctx, api) {
    const victim = _blindsideVictim(ctx);
    const p = pronouns(victim);
    const depth = bond(victim, ctx.hoh);
    const promised = wasPromised(victim, ctx.hoh, ctx?.week?.num || 0);
    const allied = sharesAlliance(victim, ctx.hoh);
    // Was this alliance visible? A public betrayal costs the HOH standing; a
    // secret one only costs them this one relationship, and nobody else learns.
    const wasVisible = perceived(victim, ctx.hoh) >= 2.5;
    const text = _variant([
      `${victim} does not move when ${p.posAdj} name is called. Not shock exactly — recalculation. Somewhere behind ${p.posAdj} eyes a week of conversations is being reread with the ending known.`,
      `"Okay," ${victim} says, to nobody. Just that. ${ctx.hoh} keeps talking and ${victim} keeps not hearing it, already three moves into a game ${p.sub} did not know ${p.sub} was losing.`,
      `The key turns and ${victim}'s face does something complicated. ${p.Sub} had defended ${ctx.hoh} twice this week — out loud, to people who are now watching ${p.obj} find out what that bought.`,
      `${victim} forces a smile through the rest of the ceremony. That night, ${p.sub} lies awake trying to work out which conversation was the lie.`,
      ...(promised ? [`${ctx.hoh} had said the words out loud — "you are not going up" — and ${victim} had been stupid enough to find that comforting. ${p.Sub} hears ${p.posAdj} own name and thinks, first, not of the block but of that sentence.`] : []),
      ...(allied ? [`They built something together and ${victim} finds out it was scaffolding. ${p.Sub} looks down the row at the others who were in that alliance, and every one of them looks somewhere else.`] : []),
    ], ctx, victim, ctx.hoh);

    // The damage scales with what was actually broken, rather than a flat number.
    api.addBond(victim, ctx.hoh, -(1.2 + bondFactor(depth) * 1.8 + (promised ? 0.6 : 0)));
    api.setTarget(victim, ctx.hoh, promised ? 'put me up after promising me I was safe' : 'put me up');
    api.remember(victim, ctx.hoh, 'betrayal', promised || allied ? 3 : 2, { act: 'nominations', promised, allied });
    api.popDelta(victim, 1);

    // Only a betrayal the house could SEE costs the HOH publicly. A hidden
    // alliance breaking is a private wound, and the rest of the house learns
    // nothing — which is exactly why hidden alliances are worth having.
    if (wasVisible) {
      api.popDelta(ctx.hoh, -1);
      _bystanders(house, ctx, victim).forEach(watcher => {
        // The perceptive notice betrayal; the oblivious carry on.
        const sharp = pStats(watcher).intuition / 10;
        api.suspicion(watcher, ctx.hoh, 0.8 * sharp);
        if (trusts(watcher, ctx.hoh) && sharp > 0.6) {
          api.remember(watcher, ctx.hoh, 'warning', 1, { saw: 'betrayed an ally at nominations' });
        }
      });
    }
    return { text, players: [victim, ctx.hoh], badgeText: wasVisible ? 'BLINDSIDED' : 'QUIET BETRAYAL', badgeClass: 'red' };
  },
};

const nomStoic = {
  id: 'nom-stoic',
  category: 'ceremonies',
  weight(house, ctx) {
    if (ctx.act !== 'nominations') return 0;
    const cool = _nominees(ctx).filter(n => pStats(n).temperament >= 6);
    if (!cool.length) return 0;
    return (pStats(cool[0]).temperament / 10) * 7;
  },
  fire(house, ctx, api) {
    const nominee = _nominees(ctx).sort((a, b) => pStats(b).temperament - pStats(a).temperament)[0];
    const p = pronouns(nominee);
    const text = _variant([
      `${nominee} takes it without a flicker. No speech, no glare, no wounded look for the cameras — ${p.sub} just picks up ${p.posAdj} key and asks what time the veto players are drawn.`,
      `Everyone watches ${nominee} for the crack. It does not come. ${p.Sub} congratulates ${ctx.hoh} on the win, means about sixty percent of it, and goes to make coffee.`,
      `"Right," says ${nominee}, standing before the ceremony is properly over. "Then I'd better win the veto." Two people laugh. One of them stops when ${p.sub} realises ${nominee} was not joking.`,
      `${nominee} does not give the room the reaction it came for. By dinner that composure has been discussed in three separate conversations, none of which ${p.sub} was in.`,
    ], ctx, nominee);

    // Refusing to panic reads as strength — and strength on the block gets noticed.
    api.popDelta(nominee, 2);
    _bystanders(house, ctx).forEach(watcher => {
      if (pStats(watcher).intuition >= 5) api.suspicion(watcher, nominee, 0.5);
    });
    return { text, players: [nominee], badgeText: 'UNSHAKEN', badgeClass: 'gold' };
  },
};

// ── veto ceremony ─────────────────────────────────────────────────────

const vetoSavedGratitude = {
  id: 'veto-saved-gratitude',
  category: 'ceremonies',
  weight(house, ctx) {
    if (ctx.act !== 'veto-ceremony' || !ctx.vetoWinner) return 0;
    const { saved } = actFacts(ctx);
    if (!saved || saved === ctx.vetoWinner) return 0;   // saving yourself earns no thanks
    // Gratitude scales with the relationship AND with how much it cost the
    // holder: saving someone the house did not expect you to save means more.
    const closeness = bondFactor(bond(saved, ctx.vetoWinner));
    const surprising = perceived(saved, ctx.vetoWinner) < 2 ? 1.4 : 1;
    // Floored, for the same reason nom-speech-game needed one: a product of
    // normalised factors bottoms out near zero for an ordinary pair, and being
    // taken off the block is not an ordinary thing to say nothing about.
    return band(4 + (pStats(saved).loyalty / 10) * (0.4 + closeness) * surprising * 10);
  },
  fire(house, ctx, api) {
    const { saved } = actFacts(ctx);
    const holder = ctx.vetoWinner;
    const p = pronouns(saved);
    const text = _variant([
      `${saved} does not say thank you in the room. ${p.Sub} waits until the house has scattered, finds ${holder} alone, and says it once, properly. It is worth more that way and they both know it.`,
      `"You didn't have to do that." ${holder} shrugs. "I did, though." ${saved} decides, on the spot and without saying so, that this is a debt ${p.sub} intends to pay.`,
      `${saved} comes off the block and the first thing ${p.sub} does is look for ${holder}. Not for the cameras — for the record. Some deals in this house are made in words and some are made in that.`,
      `“I'm not going to forget it,” ${saved} tells ${holder}. ${p.Sub} ${p.sub === 'they' ? 'mean' : 'means'} the debt, and ${holder} can hear that.`,
      `${saved} pulls ${holder} into a hug before the meeting fully breaks up. “Whatever you need next week, ask me first.”`,
      `${saved} waits until they are alone and asks ${holder} why ${pronouns(holder).sub} did it. The answer matters enough that ${saved} repeats it back.`,
    ], ctx, saved, holder);

    api.addBond(saved, holder, 2.2);
    api.remember(saved, holder, 'debt', 3, { act: 'veto-ceremony' });
    api.popDelta(holder, 1);
    return { text, players: [saved, holder], badgeText: 'SAVED', badgeClass: 'green' };
  },
};

const vetoLeftOnBlock = {
  id: 'veto-left-on-block',
  category: 'ceremonies',
  weight(house, ctx) {
    if (ctx.act !== 'veto-ceremony' || !ctx.vetoWinner) return 0;
    if (actFacts(ctx).used) return 0;
    const stranded = _strandedNominee(ctx);
    if (!stranded) return 0;
    // The silence is only loud if there was a reason to expect otherwise: a real
    // bond, a shared alliance, or a promise on the record.
    const expected = bondFactor(bond(stranded, holderOf(ctx)));
    const owed = sharesAlliance(stranded, holderOf(ctx)) ? 1.5 : 1;
    const promised = wasPromised(stranded, holderOf(ctx), ctx?.week?.num || 0) ? 1.4 : 1;
    return band(expected * owed * promised * 13);
  },
  fire(house, ctx, api) {
    const stranded = _strandedNominee(ctx);
    const holder = ctx.vetoWinner;
    const p = pronouns(stranded);
    const allied = sharesAlliance(stranded, holder);
    const closeness = bond(stranded, holder);
    const publicly = perceived(stranded, holder) >= 2.5;
    const text = _variant([
      `"I have decided not to use the Power of Veto." ${stranded} nods along with the sentence like ${p.sub} had known it was coming. ${p.Sub} had not known it was coming.`,
      `The veto stays in ${holder}'s pocket. ${stranded} looks at it for slightly too long — long enough that two people notice, and one of them files it away.`,
      `${holder} announces that the veto will not be used. ${stranded} says, “That's fine,” twice without looking at anyone.`,
      `Nothing happens at the veto ceremony, and that is the loudest thing that happens all week. ${stranded} goes to bed early. ${p.Sub} does not sleep early.`,
      `${stranded} watches ${holder} return the veto to its box. The apology ${holder} mouths across the room only makes ${p.obj} look away faster.`,
      `${holder} says the nominations should stay the same. ${stranded} had asked for a different answer in private and now knows what that conversation was worth.`,
      ...(allied ? [`${holder} and ${stranded} are supposed to be working together. When ${holder} keeps the veto, ${stranded} stares at ${pronouns(holder).obj} through the rest of the ceremony.`] : []),
    ], ctx, stranded, holder);

    // Abandonment scales with what was owed. A stranger who did not save you is
    // barely a story; an ally who did not is the story of the rest of your game.
    api.addBond(stranded, holder, -(0.7 + bondFactor(closeness) * 1.6 + (allied ? 0.5 : 0)));
    api.remember(stranded, holder, 'abandonment', allied ? 3 : 1, { act: 'veto-ceremony', allied });
    // Only worth redirecting your game at someone who owed you something.
    if (allied || closeness >= 3) {
      api.setTarget(stranded, holder, 'sat on the veto while I was on the block');
    }
    if (publicly) {
      _bystanders(house, ctx, stranded).forEach(watcher => {
        api.suspicion(watcher, holder, 0.5 * (pStats(watcher).intuition / 10));
      });
    }
    return {
      text, players: [stranded, holder],
      badgeText: allied ? 'LEFT BY AN ALLY' : 'VETO UNUSED', badgeClass: 'red',
    };
  },
};

const vetoBackdoorLands = {
  id: 'veto-backdoor-lands',
  category: 'ceremonies',
  weight(house, ctx) {
    if (ctx.act !== 'veto-ceremony') return 0;
    const { used, replacement, backdoorTarget } = actFacts(ctx);
    if (!used || !replacement) return 0;
    // Only a backdoor if the replacement was the plan all along.
    return backdoorTarget && backdoorTarget === replacement ? 14 : 0;
  },
  fire(house, ctx, api) {
    const { replacement: victim } = actFacts(ctx);
    const p = pronouns(victim);
    const text = _variant([
      `${ctx.hoh} names ${victim} as the replacement and the room understands the whole week at once — the nominations, the pawn, the conversations that went nowhere. ${victim} never played the veto because ${p.sub} was never meant to.`,
      `"As the replacement nominee, I have to name... ${victim}." Somebody exhales. ${victim} does not, for several seconds. The backdoor closes with almost no sound at all.`,
      `The plan was built before the veto was played. When ${victim}'s name is finally called, ${p.sub} walks to the chair like the floor has shifted.`,
      `${victim} had spent the week being told ${p.sub} was not a target, by people who were counting on ${p.obj} believing it. ${p.Sub} did. That was the plan.`,
      `${victim} looks first at the veto winner, then at ${ctx.hoh}, and understands why every reassuring conversation this week ended so quickly.`,
      `${ctx.hoh} names ${victim}. A few people refuse to react, which tells ${victim} exactly how many of them already knew.`,
    ], ctx, victim, ctx.hoh);

    api.addBond(victim, ctx.hoh, -2.4);
    api.setTarget(victim, ctx.hoh, 'backdoored me');
    api.remember(victim, ctx.hoh, 'betrayal', 3, { act: 'veto-ceremony', backdoor: true });
    // The whole house just watched what this HOH is capable of.
    _bystanders(house, ctx, victim).forEach(watcher => api.suspicion(watcher, ctx.hoh, 1.2));
    api.popDelta(ctx.hoh, 1);
    return { text, players: [ctx.hoh, victim], badgeText: 'BACKDOORED', badgeClass: 'red' };
  },
};

const vetoReplacementShock = {
  id: 'veto-replacement-shock',
  category: 'ceremonies',
  weight(house, ctx) {
    if (ctx.act !== 'veto-ceremony') return 0;
    const { used, replacement, backdoorTarget } = actFacts(ctx);
    if (!used || !replacement) return 0;
    // The non-backdoor case: an unplanned replacement, which stings differently.
    if (backdoorTarget && backdoorTarget === replacement) return 0;
    // Worse when the HOH putting you up was someone you trusted.
    return band((pStats(replacement).loyalty / 10) * (0.6 + bondFactor(bond(replacement, ctx.hoh))) * 10);
  },
  fire(house, ctx, api) {
    const { replacement: victim } = actFacts(ctx);
    const p = pronouns(victim);
    const text = _variant([
      `${victim} is named as the replacement and takes the chair still holding the mug ${p.sub} brought in with ${p.obj}. Small detail. It is the one everyone remembers.`,
      `"I need a replacement nominee." ${victim} already knows. ${p.Sub} knew from the moment the veto came off — there was only ever one name that made the numbers work.`,
      `${victim} sits down hard. Not betrayed, exactly—spent. The distinction disappears as soon as the house starts counting votes.`,
      `The replacement is ${victim}, and the strange thing is how ordinary it feels — no gasp, no drama, just the week rearranging itself around ${p.obj} while ${p.sub} watches.`,
      `${victim}'s name lands without warning. ${p.Sub} asks ${ctx.hoh}, “Was this always the plan?” and gets no answer before taking the chair.`,
      `${victim} thought the veto would change somebody else's week. Then ${ctx.hoh} says ${p.posAdj} name and every conversation becomes evidence.`,
    ], ctx, victim, ctx.hoh);

    api.addBond(victim, ctx.hoh, -1.1);
    api.remember(victim, ctx.hoh, 'grudge', 1, { act: 'veto-ceremony' });
    api.popDelta(victim, 1);
    return { text, players: [victim, ctx.hoh], badgeText: 'REPLACEMENT', badgeClass: 'red' };
  },
};


// ── eviction night ────────────────────────────────────────────────────
//
// The exit interview the format is built around, and until now impossible to
// write: the eviction act was hardcoded to produce no beats at all, so the last
// thing a houseguest ever did was be a number in a vote tally.
//
// What somebody says on the way out is not decoration. It is the last
// information the jury gets about the person who evicted them, and the house
// has to live with whatever was said.

const evictionGracious = {
  id: 'evict-farewell-gracious',
  category: 'ceremonies',
  weight(house, ctx) {
    if (ctx.act !== 'eviction' || !ctx.evicted) return 0;
    const s = pStats(ctx.evicted);
    // Composure and warmth make for a gracious exit; a grudge makes it unlikely.
    // Floored, and that is the THIRD event in this file to need it — the same
    // shape as nom-speech-game and veto-saved-gratitude. A weight built as a
    // product of normalised stats bottoms out near zero for an ordinary
    // houseguest: 0.5 x 0.65 x 14 is 4.5 against siblings sitting near 14, so
    // the event only ever fires for the rare person who is high in everything,
    // and any reshuffle of the season knocks it out entirely.
    //
    // Most people leaving this house say something decent on the way out. That
    // is the ordinary case and it should not need an exceptional temperament.
    const grace = (s.temperament / 10) * (0.4 + s.loyalty / 20);
    const bitter = grudge(ctx.evicted, ctx.hoh) >= 2 ? 0.4 : 1;
    return band(4 + grace * bitter * 10);
  },
  fire(house, ctx, api) {
    const gone = ctx.evicted;
    const p = pronouns(gone);
    const closest = _nominees(ctx).includes(gone)
      ? house.filter(n => n !== gone).sort((a, b) => bond(gone, b) - bond(gone, a))[0]
      : null;
    const text = _variant([
      `${gone} hugs everybody on the way out, and means most of them. "Play hard. I'll be watching every second."`,
      `"I'm not going to stand here and be bitter about a game I asked to be in." ${gone} says it lightly, and the room believes ${p.obj}, and that is worth more than ${p.sub} realises tonight.`,
      `${gone} takes the long way to the door, saying one specific thing to each person. Several of them will remember exactly what ${p.sub} said when they are asked to vote for a winner.`,
      `${gone} tells the surviving nominee to breathe, thanks the house for the game and refuses every whispered apology on the way to the door.`,
      `“No hard feelings. Seriously.” ${gone} hugs the people nearest the door and leaves before anybody can turn the goodbye into an explanation.`,
      `${gone} smiles through the shock and says, “Somebody had to be right and somebody had to leave.” The line releases the room enough for the hugs to begin.`,
      ...(closest ? [`${gone} stops at ${closest} last. Whatever gets said is too quiet for the room, and ${closest} does not sit back down for a while after the door closes.`] : []),
    ], ctx, gone);

    // A gracious exit is remembered kindly, which matters when a jury forms.
    api.popDelta(gone, 3);
    house.filter(n => n !== gone).forEach(n => {
      if (bond(n, gone) > 0) api.addBond(n, gone, 0.3);
      api.remember(n, gone, 'respect', 1, { about: 'left with grace' });
    });
    if (closest) api.remember(closest, gone, 'kindness', 2, { when: 'the last night' });
    return { text, players: [gone, closest].filter(Boolean), badgeText: 'GRACIOUS EXIT', badgeClass: 'gold' };
  },
};

const evictionScorched = {
  id: 'evict-farewell-scorched',
  category: 'ceremonies',
  weight(house, ctx) {
    if (ctx.act !== 'eviction' || !ctx.evicted) return 0;
    const s = pStats(ctx.evicted);
    const heat = ((10 - s.temperament) / 10) * (s.boldness / 10);
    const betrayed = grudge(ctx.evicted, ctx.hoh) >= 2 || remembers(ctx.evicted, ctx.hoh, 'betrayal');
    return band(heat * (betrayed ? 16 : 7));
  },
  fire(house, ctx, api) {
    const gone = ctx.evicted;
    const p = pronouns(gone);
    // Name the person they blame, which is who actually put them there.
    const blamed = targetOf(gone)
      || house.filter(n => n !== gone).sort((a, b) => grudge(gone, b) - grudge(gone, a))[0]
      || ctx.hoh;
    const text = _variant([
      `${gone} does not hug anybody. "${blamed}. You know what you did, and now so does everyone watching." The door closes on a silent room.`,
      `“I'd say good luck, but I'd be lying.” ${gone} looks directly at ${blamed}, picks up ${p.posAdj} bag and walks out.`,
      `${gone} uses the goodbye to repeat what ${blamed} promised, what ${blamed} did instead and who should compare notes after the door closes.`,
      `${gone} turns the exit into a warning. “If ${blamed} told you the same thing, talk to each other before the next vote.”`,
      `${gone} hugs around ${blamed}, stops at the door and says, “You got me. Now explain to them why they're next.”`,
      `${gone} names the deal ${blamed} broke and the lie that protected it. Nobody has time to answer before ${gone} leaves.`,
    ], ctx, gone, blamed);

    // A scorched exit is a gift and a curse: the house learns something true,
    // and the person who leaves it becomes somebody the jury remembers badly.
    api.popDelta(gone, 1);
    api.popDelta(blamed, -2);
    house.filter(n => n !== gone && n !== blamed).forEach(n => {
      api.suspicion(n, blamed, 1.4 * (pStats(n).intuition / 10));
      api.remember(n, blamed, 'warning', 1, { from: gone, when: 'the exit speech' });
    });
    api.remember(blamed, gone, 'humiliation', 2, { when: 'the exit speech' });
    return { text, players: [gone, blamed], badgeText: 'SCORCHED EARTH', badgeClass: 'red' };
  },
};

const evictionBlindsided = {
  id: 'evict-farewell-blindsided',
  category: 'ceremonies',
  weight(house, ctx) {
    if (ctx.act !== 'eviction' || !ctx.evicted || !ctx.votes) return 0;
    // Only a blindside if they had no idea — a near-unanimous vote against
    // somebody who thought they were safe.
    const against = ctx.votes[ctx.evicted] || 0;
    const other = Object.entries(ctx.votes).find(([n]) => n !== ctx.evicted)?.[1] || 0;
    if (against <= other + 1) return 0;
    const trusted = house.filter(n => n !== ctx.evicted && trusts(ctx.evicted, n, 2.5)).length;
    return band(trusted * 4);
  },
  fire(house, ctx, api) {
    const gone = ctx.evicted;
    const p = pronouns(gone);
    const trusted = house.filter(n => n !== gone && trusts(gone, n, 2.5))
      .sort((a, b) => bond(gone, b) - bond(gone, a));
    const betrayer = trusted[0] || house.find(n => n !== gone);
    const text = _variant([
      `${gone} stands up before the vote is finished being read, because ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} already worked out that the number is too big to be anyone but ${p.posAdj} own side.`,
      `When the vote is announced, ${gone} looks straight at ${betrayer}. ${betrayer} looks down at the floor and does not look up again.`,
      `${gone} says "wow" once, quietly. ${p.Sub} does not say anything else on the way out, and the silence does more damage than a speech would have.`,
      `${gone} had the votes counted this morning. ${p.Sub} had them counted wrong, and the difference is standing three feet away not making eye contact.`,
      `${gone} looks from one trusted face to the next and finds the same apology waiting on all of them. “So everybody knew but me.”`,
      `${gone} starts toward the door, stops beside ${betrayer} and asks, “Was any of it real?” The live-show clock moves before ${betrayer} answers.`,
      `${betrayer} reaches for a goodbye hug. ${gone} steps around ${pronouns(betrayer).obj} and hugs the person behind ${pronouns(betrayer).obj} instead.`,
    ], ctx, gone, betrayer);

    api.popDelta(gone, 2);
    api.popDelta(betrayer, -1);
    api.remember(gone, betrayer, 'betrayal', 3, { when: 'the eviction vote' });
    // The house saw a group turn on its own. Everyone updates.
    house.filter(n => n !== gone && n !== betrayer).forEach(n => {
      api.suspicion(n, betrayer, 1.1 * (pStats(n).intuition / 10));
    });
    return { text, players: [gone, betrayer], badgeText: 'BLINDSIDED ON THE WAY OUT', badgeClass: 'red' };
  },
};

export const CEREMONY_EVENTS = [
  nomSpeechGame,
  nomSpeechPersonal,
  nomPawnReassured,
  nomBlindside,
  nomStoic,
  vetoSavedGratitude,
  vetoLeftOnBlock,
  vetoBackdoorLands,
  vetoReplacementShock,
  evictionGracious,
  evictionScorched,
  evictionBlindsided,
];

export default CEREMONY_EVENTS;
