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

import { pronouns } from '../players.js';
import {
  pStats, bond, perceived, band, bondFactor, sharesAlliance, trusts, dislikes, actFacts,
  wasPromised, remembers, grudge, suspicionOf, willScheme, isVillainous, archetype,
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
    // A composed, strategic HOH is the one who keeps it about the game.
    return (s.strategic / 10) * (s.temperament / 10) * 9;
  },
  fire(house, ctx, api) {
    const [a, b] = _nominees(ctx);
    const p = pronouns(ctx.hoh);
    const text = _variant([
      `${ctx.hoh} keeps the ceremony short. "${a}, ${b} — this is not personal, and I'm not going to insult either of you by pretending it was hard." Nobody in the room believes the second half.`,
      `"I want to be clear," ${ctx.hoh} says, turning the key. "${a}, ${b}, you're sitting there because of where the numbers are this week. Not because of anything you did to me." It is the most reasonable thing anyone has said all week, which is exactly why ${p.sub} is being watched so carefully.`,
      `${ctx.hoh} names ${a} and ${b} without raising ${p.posAdj} voice once. No speech, no justification, no apology. The house reads the calm as competence, which is worse for ${p.obj} than anger would have been.`,
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
    const heat = ((10 - s.temperament) / 10) * (s.boldness / 10);
    const nasty = isVillainous(ctx.hoh) || archetype(ctx.hoh) === 'hothead' ? 11 : 4;
    const target = ctx.target && _nominees(ctx).includes(ctx.target) ? ctx.target : _nominees(ctx)[0];
    const bad = dislikes(ctx.hoh, target) ? 1.6 : 1;
    const owed = grudge(ctx.hoh, target) >= 2 ? 1.5 : 1;
    return band(heat * nasty * bad * owed);
  },
  fire(house, ctx, api) {
    const target = ctx.target && _nominees(ctx).includes(ctx.target) ? ctx.target : _nominees(ctx)[0];
    const other = _nominees(ctx).find(n => n !== target) || _nominees(ctx)[1];
    const p = pronouns(ctx.hoh);
    const text = _variant([
      `${ctx.hoh} does not keep it civil. "${target}, you've been running your mouth about me since week one and you thought I wasn't hearing it." The room goes very still. ${other} stares at the floor, grateful and ashamed of being grateful.`,
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
      `${ctx.hoh} finds ${pawn} in the storage room within the hour. "You're not the one going. I need you up there and I need you to trust me for four days." ${pawn} says yes. ${p.Sub} means it, mostly.`,
      `"Say it to my face," ${pawn} says. ${ctx.hoh} does: "You are a pawn. You are safe. If that changes you'll hear it from me before you hear it from anyone else." It is the exact sentence every pawn in the history of this house has been told.`,
      `${ctx.hoh} catches ${pawn} on the stairs and talks fast and low. ${pawn} nods along, and only afterwards, alone, works out that ${p.sub} never actually got a number — just a tone.`,
      `The reassurance is delivered over dishes, which is how ${pawn} knows it is meant to sound casual. "Four days," ${ctx.hoh} says. "Then we never do this again." ${pawn} laughs. It is not entirely a laugh.`,
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
      `${victim} smiles, which is the worst possible response and the only one available. Later, in the dark, ${p.sub} will work out exactly which conversation was the lie. Right now ${p.sub} just holds the smile.`,
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
    return band((pStats(saved).loyalty / 10) * (0.4 + closeness) * surprising * 14);
  },
  fire(house, ctx, api) {
    const { saved } = actFacts(ctx);
    const holder = ctx.vetoWinner;
    const p = pronouns(saved);
    const text = _variant([
      `${saved} does not say thank you in the room. ${p.Sub} waits until the house has scattered, finds ${holder} alone, and says it once, properly. It is worth more that way and they both know it.`,
      `"You didn't have to do that." ${holder} shrugs. "I did, though." ${saved} decides, on the spot and without saying so, that this is a debt ${p.sub} intends to pay.`,
      `${saved} comes off the block and the first thing ${p.sub} does is look for ${holder}. Not for the cameras — for the record. Some deals in this house are made in words and some are made in that.`,
      `"I'm not going to forget it," ${saved} tells ${holder}, and for once in this house it is not a line. ${p.Sub} has a very long memory and has just decided who it is for.`,
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
      `${holder} says the words and sits down. ${stranded} says "that's fine" to nobody in particular, twice, which is once more than anyone says a thing they mean.`,
      `Nothing happens at the veto ceremony, and that is the loudest thing that happens all week. ${stranded} goes to bed early. ${p.Sub} does not sleep early.`,
      ...(allied ? [`They are supposed to be on the same side. ${holder} keeps the veto in ${pronouns(holder).posAdj} pocket and ${stranded} works out, in real time and in front of everyone, what side actually means in this house.`] : []),
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
      `It was built four days ago and it lands in four seconds. ${victim} walks to the chair like the floor has moved, because for ${p.obj} it has.`,
      `${victim} had spent the week being told ${p.sub} was not a target, by people who were counting on ${p.obj} believing it. ${p.Sub} did. That was the plan.`,
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
      `${victim} sits down hard. Not betrayed, exactly. Spent. There is a difference and by Thursday it will not matter.`,
      `The replacement is ${victim}, and the strange thing is how ordinary it feels — no gasp, no drama, just the week rearranging itself around ${p.obj} while ${p.sub} watches.`,
    ], ctx, victim, ctx.hoh);

    api.addBond(victim, ctx.hoh, -1.1);
    api.remember(victim, ctx.hoh, 'grudge', 1, { act: 'veto-ceremony' });
    api.popDelta(victim, 1);
    return { text, players: [victim, ctx.hoh], badgeText: 'REPLACEMENT', badgeClass: 'red' };
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
];

export default CEREMONY_EVENTS;
