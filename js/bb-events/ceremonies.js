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
import {
  pStats, bond, perceived, band, bondFactor, sharesAlliance, trusts, dislikes, actFacts,
  wasPromised, remembers, grudge, suspicionOf, willScheme, isVillainous, archetype, targetOf,
} from './_read.js';
import { gs } from '../core.js';
import { listBlocs, knowledgeOf, exposeBloc } from '../bb/blocs.js';
import { knowsVote } from '../bb/knowledge.js';
import { factId, learn } from '../knowledge.js';
import { makeScene } from '../bb/script/scene.js';

// ── helpers ───────────────────────────────────────────────────────────

// Stable across replays of the same seed, different across a season. Mixing the
// player names in is what stops every week's nomination speech reading alike.

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
    const scene = makeScene('cer.nomgame', { a: ctx.hoh, b: a, c: b }, { ending: 'scene' }, house, 'living-room');

    // Composure reads as competence, and competence is a target.
    api.popDelta(ctx.hoh, 1);
    _bystanders(house, ctx).forEach(watcher => {
      if (pStats(watcher).intuition >= 6) api.suspicion(watcher, ctx.hoh, 0.6);
    });
    api.addBond(ctx.hoh, a, -0.3);
    api.addBond(ctx.hoh, b, -0.3);
    return { scene, players: [ctx.hoh, a, b], badgeText: 'NOMINATIONS', badgeClass: 'blue' };
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
    const scene = makeScene('cer.nompersonal', { a: ctx.hoh, b: target, c: other || null }, { ending: 'scene' }, house, 'living-room');

    // A personal nomination buys a grudge and costs standing.
    api.addBond(ctx.hoh, target, -1.6);
    api.setTarget(target, ctx.hoh, 'named me personally at the ceremony');
    api.remember(target, ctx.hoh, 'humiliation', 2, { act: 'nominations' });
    api.popDelta(ctx.hoh, -1);
    _bystanders(house, ctx).forEach(watcher => api.suspicion(watcher, ctx.hoh, 0.4));
    return { scene, players: [ctx.hoh, target, other].filter(Boolean), badgeText: 'MADE IT PERSONAL', badgeClass: 'red' };
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
    // A schemer's reassurance is worth less, and a pawn who already remembers a
    // broken promise from this person believes almost none of it.
    const honest = !willScheme(ctx.hoh);
    const burnedBefore = remembers(pawn, ctx.hoh, 'betrayal') || grudge(pawn, ctx.hoh) >= 2;
    const wary = suspicionOf(pawn, ctx.hoh);
    const scene = makeScene('cer.pawn', { a: ctx.hoh, b: pawn }, { ending: burnedBefore ? 'burned' : 'trusted' }, [], 'pantry');

    // A reassurance is worth what the relationship behind it is worth. Someone
    // already burned by this person takes almost nothing from it.
    const believed = Math.max(0.15, (honest ? 1 : 0.6) * (burnedBefore ? 0.3 : 1) * (1 - Math.min(0.6, wary / 12)));
    api.addBond(ctx.hoh, pawn, 1.2 * believed);
    // The promise goes on the record either way — that is what makes breaking it
    // cost something later, at the veto ceremony or at the vote.
    api.remember(pawn, ctx.hoh, 'promise', honest ? 1 : 2, { promise: 'you are only a pawn', believed: Math.round(believed * 100) / 100 });
    if (!honest || burnedBefore) api.suspicion(pawn, ctx.hoh, burnedBefore ? 1.2 : 0.8);
    return {
      scene, players: [ctx.hoh, pawn],
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
    const depth = bond(victim, ctx.hoh);
    const promised = wasPromised(victim, ctx.hoh, ctx?.week?.num || 0);
    const allied = sharesAlliance(victim, ctx.hoh);
    // Was this alliance visible? A public betrayal costs the HOH standing; a
    // secret one only costs them this one relationship, and nobody else learns.
    const wasVisible = perceived(victim, ctx.hoh) >= 2.5;
    const scene = makeScene('cer.blindside', { a: victim, b: ctx.hoh }, { ending: 'scene', intent: promised ? 'promised' : allied ? 'allied' : 'plain' }, house, 'living-room');

    // The damage scales with what was actually broken, rather than a flat
    // number — and its MAXIMUM sits inside the per-event bond cap (2.5), or
    // the clamp flattens a promised betrayal and an ordinary one into the
    // same hit and the scaling silently stops being true.
    api.addBond(victim, ctx.hoh, -(0.9 + bondFactor(depth) * 1.1 + (promised ? 0.45 : 0)));
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
    return { scene, players: [victim, ctx.hoh], badgeText: wasVisible ? 'BLINDSIDED' : 'QUIET BETRAYAL', badgeClass: 'red' };
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
    const scene = makeScene('cer.stoic', { a: nominee }, { ending: 'scene' }, house, 'living-room');

    // Refusing to panic reads as strength — and strength on the block gets noticed.
    api.popDelta(nominee, 2);
    _bystanders(house, ctx).forEach(watcher => {
      if (pStats(watcher).intuition >= 5) api.suspicion(watcher, nominee, 0.5);
    });
    return { scene, players: [nominee], badgeText: 'UNSHAKEN', badgeClass: 'gold' };
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
    const scene = makeScene('cer.saved', { a: saved, b: holder }, { ending: 'scene' }, [], 'living-room');

    api.addBond(saved, holder, 2.2);
    api.remember(saved, holder, 'debt', 3, { act: 'veto-ceremony' });
    api.popDelta(holder, 1);
    return { scene, players: [saved, holder], badgeText: 'SAVED', badgeClass: 'green' };
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
    const allied = sharesAlliance(stranded, holder);
    const closeness = bond(stranded, holder);
    const publicly = perceived(stranded, holder) >= 2.5;
    const scene = makeScene('cer.left', { a: stranded, b: holder }, { ending: 'scene', intent: allied ? 'allied' : 'plain' }, house, 'living-room');

    // Abandonment scales with what was owed. A stranger who did not save you is
    // barely a story; an ally who did not is the story of the rest of your game.
    api.addBond(stranded, holder, -(0.7 + bondFactor(closeness) * 1.3 + (allied ? 0.4 : 0)));
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
      scene, players: [stranded, holder],
      badgeText: allied ? 'LEFT BY AN ALLY' : 'VETO UNUSED', badgeClass: 'red',
    };
  },
};

const vetoBackdoorLands = {
  id: 'veto-backdoor-lands',
  category: 'ceremonies',
  weight(house, ctx) {
    if (ctx.act !== 'veto-ceremony') return 0;
    // This event narrates the HOH's week-long plan closing — which is false
    // twice over on special weeks: under the Diamond Veto the HOLDER named
    // the replacement, and on an invisible week nobody's name was attached
    // at all. The engine's own beats (HIJACKED, the guess cards) own those.
    if (ctx.week?.vetoDecision?.diamond || ctx.week?.hohSecret) return 0;
    const { used, replacement, backdoorTarget } = actFacts(ctx);
    if (!used || !replacement) return 0;
    // Only a backdoor if the replacement was the plan all along.
    return backdoorTarget && backdoorTarget === replacement ? 14 : 0;
  },
  fire(house, ctx, api) {
    const { replacement: victim } = actFacts(ctx);
    const scene = makeScene('cer.backdoor', { a: victim, b: ctx.hoh }, { ending: 'scene' }, house, 'living-room');

    api.addBond(victim, ctx.hoh, -2.4);
    api.setTarget(victim, ctx.hoh, 'backdoored me');
    api.remember(victim, ctx.hoh, 'betrayal', 3, { act: 'veto-ceremony', backdoor: true });
    // The whole house just watched what this HOH is capable of.
    _bystanders(house, ctx, victim).forEach(watcher => api.suspicion(watcher, ctx.hoh, 1.2));
    api.popDelta(ctx.hoh, 1);
    return { scene, players: [ctx.hoh, victim], badgeText: 'BACKDOORED', badgeClass: 'red' };
  },
};

const vetoReplacementShock = {
  id: 'veto-replacement-shock',
  category: 'ceremonies',
  weight(house, ctx) {
    if (ctx.act !== 'veto-ceremony') return 0;
    // An invisible week has no named namer — the engine's guess cards carry
    // the reaction, aimed at whoever the replacement DECIDED it was.
    if (ctx.week?.hohSecret && !ctx.week?.vetoDecision?.diamond) return 0;
    const { used, replacement, backdoorTarget } = actFacts(ctx);
    if (!used || !replacement) return 0;
    // The non-backdoor case: an unplanned replacement, which stings differently.
    if (backdoorTarget && backdoorTarget === replacement) return 0;
    // Whoever actually said the name: the HOH normally, the veto holder
    // under the Diamond Veto. The grievance follows the voice, not the key.
    const namer = ctx.week?.vetoDecision?.diamond
      ? (ctx.week.vetoDecision.chairAuthority || ctx.hoh) : ctx.hoh;
    // Worse when the person putting you up was someone you trusted.
    return band((pStats(replacement).loyalty / 10) * (0.6 + bondFactor(bond(replacement, namer))) * 10);
  },
  fire(house, ctx, api) {
    const { replacement: victim } = actFacts(ctx);
    const namer = ctx.week?.vetoDecision?.diamond
      ? (ctx.week.vetoDecision.chairAuthority || ctx.hoh) : ctx.hoh;
    const scene = makeScene('cer.replace', { a: victim, b: namer }, { ending: 'scene' }, house, 'living-room');

    api.addBond(victim, namer, -1.1);
    api.remember(victim, namer, 'grudge', 1, { act: 'veto-ceremony' });
    api.popDelta(victim, 1);
    return { scene, players: [victim, namer], badgeText: 'REPLACEMENT', badgeClass: 'red' };
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
    const closest = _nominees(ctx).includes(gone)
      ? house.filter(n => n !== gone).sort((a, b) => bond(gone, b) - bond(gone, a))[0]
      : null;
    const scene = makeScene('cer.gracious', { a: gone, b: closest || null }, { ending: 'scene', intent: closest ? 'close' : 'plain' }, house, 'living-room');

    // A gracious exit is remembered kindly, which matters when a jury forms.
    api.popDelta(gone, 3);
    house.filter(n => n !== gone).forEach(n => {
      if (bond(n, gone) > 0) api.addBond(n, gone, 0.3);
      api.remember(n, gone, 'respect', 1, { about: 'left with grace' });
    });
    if (closest) api.remember(closest, gone, 'kindness', 2, { when: 'the last night' });
    return { scene, players: [gone, closest].filter(Boolean), badgeText: 'GRACIOUS EXIT', badgeClass: 'gold' };
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
    // Name the person they blame, which is who actually put them there.
    const blamed = targetOf(gone)
      || house.filter(n => n !== gone).sort((a, b) => grudge(gone, b) - grudge(gone, a))[0]
      || ctx.hoh;

    // A scorched exit is a gift and a curse: the house learns something true,
    // and the person who leaves it becomes somebody the jury remembers badly.
    api.popDelta(gone, 1);
    api.popDelta(blamed, -2);
    house.filter(n => n !== gone && n !== blamed).forEach(n => {
      api.suspicion(n, blamed, 1.4 * (pStats(n).intuition / 10));
      api.remember(n, blamed, 'warning', 1, { from: gone, when: 'the exit speech' });
    });
    api.remember(blamed, gone, 'humiliation', 2, { when: 'the exit speech' });

    // And the revelation is REAL now, not narrated. The text has always
    // claimed the evictee "names the deal and the lie" — while mechanically
    // the speech moved suspicion and nothing else, so the house was told a
    // secret and did not learn it. A person walking out that door has nothing
    // left to lose and a microphone, so whatever they genuinely know lands as
    // knowledge: strongest single revelation only, because a list read at the
    // door is a rant and one name is a detonation.
    let reveal = { ending: 'plain' };
    try {
      // The group they are sure of, said in front of everybody.
      const bloc = listBlocs().find(b => b.members.includes(blamed)
        && !b.members.includes(gone) && knowledgeOf(gone, b.id) >= 0.55);
      if (bloc) {
        exposeBloc(bloc, { everybody: true, week: ctx?.week?.num || 0, how: 'named at the door' });
        reveal = { ending: 'bloc', group: bloc.label };
      } else {
        // The lie they were the victim of, hung on the liar in public.
        const claim = (gs.bb?.falseClaims || []).find(c => !c.exposed
          && c.mark === gone && house.includes(c.liar));
        if (claim) {
          claim.exposed = true;
          house.filter(n => n !== claim.liar && n !== gone).forEach(n => {
            api.suspicion(n, claim.liar, 1.2);
            api.remember(n, claim.liar, 'made-it-up', 2, { about: gone });
          });
          api.popDelta(claim.liar, -2);
          reveal = { ending: 'lie', liar: claim.liar };
        } else {
          // Or a ballot they know about, made public from the doorway.
          const week = (gs.bb?.weeks || []).find(w => w.evicted
            && w.evicted !== gone && knowsVote(gone, blamed, w.evicted));
          if (week) {
            house.filter(n => n !== gone).forEach(n => {
              try {
                learn(n, factId('vote', blamed, week.evicted),
                  { sourceType: 'public', ep: ctx?.week?.num || 0 });
              } catch { /* the fact aged out */ }
            });
            reveal = { ending: 'vote', voted: week.evicted };
          }
        }
      }
    } catch { /* the exit still burns without the receipts */ }

    const scene = makeScene('cer.scorched', { a: gone, b: blamed }, reveal, house, 'living-room');
    return { scene, players: [gone, blamed], badgeText: 'SCORCHED EARTH', badgeClass: 'red' };
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
    const trusted = house.filter(n => n !== gone && trusts(gone, n, 2.5))
      .sort((a, b) => bond(gone, b) - bond(gone, a));
    const betrayer = trusted[0] || house.find(n => n !== gone);
    const scene = makeScene('cer.blindsided', { a: gone, b: betrayer }, { ending: 'scene' }, house, 'living-room');

    api.popDelta(gone, 2);
    api.popDelta(betrayer, -1);
    api.remember(gone, betrayer, 'betrayal', 3, { when: 'the eviction vote' });
    // The house saw a group turn on its own. Everyone updates.
    house.filter(n => n !== gone && n !== betrayer).forEach(n => {
      api.suspicion(n, betrayer, 1.1 * (pStats(n).intuition / 10));
    });
    return { scene, players: [gone, betrayer], badgeText: 'BLINDSIDED ON THE WAY OUT', badgeClass: 'red' };
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
