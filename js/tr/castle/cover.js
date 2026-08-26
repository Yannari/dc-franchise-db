// ══════════════════════════════════════════════════════════════════════
// tr/castle/cover.js — the alibi, the deflection, the plant. Traitor-only.
// ══════════════════════════════════════════════════════════════════════
//
// ROLE OVERRIDES ARCHETYPE (spec §5.9). CLAUDE.md's "nice archetypes never
// scheme" rule describes what someone WOULD choose to do; it does not
// describe what a person forced to lie every day is capable of once the
// role has already been assigned to them. Every weight() below gates on
// `alignmentAt(name, ep) === 'traitor'` — role, i.e. permission — and NEVER
// on archetype. Archetype only ever appears inside fire(), to score
// COMPETENCE at a cover story the role already grants. A hero who accepted
// recruitment runs `cover-story-check` exactly like a schemer does; they are
// just visibly worse at it, which is the point, not a bug to route around.
//
// No belief writes. Cover is the Traitors' half of a channel — what a room
// eventually believes about a planted name is a suspicion.js /
// deduction.js question, earned through gateChannel(), not decided here.
import { gs, players } from '../../core.js';
import { pStats } from '../../players.js';
import { addBond, getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { openThread, advanceThread, findOpenThread } from '../threads.js';
import { alignmentAt, livingFaithfuls } from '../roles.js';
import { knowsAlignmentOf } from '../deduction.js';

const FAMILY = 'cover';
const NICE_ARCHETYPES = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function isTraitor(name, ep) { return alignmentAt(name, ep) === 'traitor'; }

registerEvent({
  id: 'cover-preemptive-alibi',
  family: FAMILY,
  window: 'morning',
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    return actor ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const t = openThread(FAMILY, [actor], ctx.ep,
      `${actor} had an answer ready for a question nobody had asked yet.`);
    return { branch: 'alibi-built', actor, threadId: t?.id };
  },
});

registerEvent({
  id: 'cover-suspect-own-ally',
  family: FAMILY,
  window: 'evening',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // The pact is read through what `a` KNOWS, not through what `b` IS — see
    // the note on cover-swap-story-with-partner.
    return isTraitor(a, ctx.ep) && knowsAlignmentOf(a, b, ctx.ep) ? 2 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    // The misdirection is real strategy, but the FRICTION it creates is real
    // too — publicly turning on your own ally costs something even when it
    // is staged, which is why this still moves the bond down.
    addBond(a, b, -1);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      `${a} threw suspicion at ${b} in front of the room — their own ally, on purpose, to clear both their names.`);
    return { branch: 'sacrificed-ally', pair: [a, b], threadId: t?.id, bondDelta: -1 };
  },
});

registerEvent({
  id: 'cover-plant-a-name',
  family: FAMILY,
  window: 'evening',
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    return actor && livingFaithfuls(ctx.ep).length ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const pool = livingFaithfuls(ctx.ep).filter(n => n !== actor);
    const target = pick(rng, pool.length ? pool : livingFaithfuls(ctx.ep));
    // Residue only — NOT a belief. This is the setup a later suspicion.js
    // event can pick up on ("why does everyone keep saying that name?"); the
    // plant itself proves nothing and must not read as evidence of anything
    // to the deduction layer.
    const t = openThread(FAMILY, [actor], ctx.ep,
      `${actor} found three separate ways to work ${target}'s name into casual conversation today.`);
    return { branch: 'planted', actor, target, threadId: t?.id };
  },
});

registerEvent({
  id: 'cover-rehearsed-story-advance',
  family: FAMILY,
  window: 'dawn',
  advancesThread: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    if (!actor) return 0;
    return findOpenThread(FAMILY, [actor]) ? 2 : 0;
  },
  fire(ctx) {
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const t = findOpenThread(FAMILY, [actor]);
    const advanced = advanceThread(t.id, ctx.ep, `${actor} told the same story again, word for word. Nobody clocked the repetition.`);
    return { branch: 'rehearsed', actor, threadId: advanced?.id };
  },
});

registerEvent({
  id: 'cover-cold-sweat-tell',
  family: FAMILY,
  window: 'after-table',
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    if (!actor) return 0;
    return pStats(actor).temperament < 4 ? 2 : 0;
  },
  fire(ctx) {
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const t = openThread(FAMILY, [actor], ctx.ep,
      `${actor} broke a small sweat on a completely ordinary follow-up question.`);
    return { branch: 'tell', actor, threadId: t?.id };
  },
});

// ── FLAGSHIP: the cover story check — a four-way fork on a COMPETENCE roll
// that role, not archetype, gives everyone equal permission to attempt ──
//
// Permission is checked ONCE, in weight(), on role alone: any living Traitor
// is eligible, full stop. Competence is computed in fire(), from strategic +
// boldness + temperament, with a FLAT PENALTY applied when the actor's
// archetype is one of the "nice" archetypes CLAUDE.md says never scheme.
// That penalty is the whole mechanical expression of "role overrides
// archetype": the hero is not blocked from running this event (archetype
// would say they should be), but their odds of the best outcome are worse
// than a schemer's, every single time it fires.
const OUTCOME_LINES = {
  convincing: [
    '{a} told a clean, boring, believable story, and the room moved on without a second look.',
    'Whatever {a} said, it landed exactly as ordinary as intended.',
  ],
  awkward: [
    '{a}\'s story had a wobble in it. Nobody happened to be listening closely enough to catch it.',
    'It wasn\'t {a}\'s best work, but it got through.',
  ],
  suspicious: [
    '{a}\'s answer came a half-second too fast, and at least one person in the room noticed.',
    'Something about the way {a} told it made {b} quietly file it away.',
  ],
  slip: [
    '{a} said too much, too fast, and had to walk it back in real time.',
    'The story fell apart in {a}\'s own mouth halfway through telling it.',
  ],
};

registerEvent({
  id: 'cover-story-check',
  family: FAMILY,
  window: 'evening',
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    // ROLE IS THE ONLY GATE. Any living Traitor may attempt this — a hero
    // who took the recruitment is exactly as eligible as a schemer. Nothing
    // here reads archetype; that only happens after eligibility is decided.
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    return actor ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const partner = ctx.actors.find(n => n !== actor) || null;
    const st = pStats(actor);
    const archetype = players.find(p => p.name === actor)?.archetype || 'floater';

    // COMPETENCE, not permission. The nice-archetype penalty is the entire
    // mechanism: it never removes the branch, it only shifts the roll toward
    // the bad outcomes — a hero-turned-Traitor visibly struggling at the
    // exact thing the role now requires of them every single episode.
    let competence = (st.strategic / 10) * 0.4 + (st.boldness / 10) * 0.3 + (st.temperament / 10) * 0.3;
    if (NICE_ARCHETYPES.includes(archetype)) competence -= 0.25;
    competence = Math.max(0.05, Math.min(0.95, competence));

    const convincingScore = competence * 0.5;
    const awkwardScore = 0.3;
    const suspiciousScore = (1 - competence) * 0.35;
    const slipScore = (1 - competence) * 0.25;
    const total = convincingScore + awkwardScore + suspiciousScore + slipScore;
    const roll = rng() * total;
    let branch;
    if (roll < convincingScore) branch = 'convincing';
    else if (roll < convincingScore + awkwardScore) branch = 'awkward';
    else if (roll < convincingScore + awkwardScore + suspiciousScore) branch = 'suspicious';
    else branch = 'slip';

    let line = pick(rng, OUTCOME_LINES[branch]).replace('{a}', actor);
    line = partner ? line.replace('{b}', partner) : line.replace(/,?\s*\{b\}[^.]*\./, '.');

    const parties = partner ? [actor, partner] : [actor];
    let bondDelta = 0;
    if (branch === 'convincing' && partner) bondDelta = 1;       // sold it together
    else if (branch === 'suspicious' && partner) bondDelta = -1; // partner half-clocked it
    else if (branch === 'slip' && partner) bondDelta = -2;       // partner had to watch it fall apart
    if (bondDelta) addBond(actor, partner, bondDelta);

    const t = openThread(FAMILY, parties, ctx.ep, line);
    return { branch, actor, partner, archetype, isNiceButTraitor: NICE_ARCHETYPES.includes(archetype),
      competence, threadId: t?.id, bondDelta };
  },
});

// ── Task 6 additions ────────────────────────────────────────────────────

registerEvent({
  id: 'cover-double-bluff',
  family: FAMILY,
  window: 'evening',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // Needs a Traitor in the scene and somebody they know is NOT in the pact
    // to sell it to. Two things this does NOT do: read `b`'s hidden alignment
    // (it reads `a`'s own knowledge of the turret instead), and require that
    // the Traitor happened to be drawn FIRST. The scene sampler orders actors
    // at random, so a positional requirement silently halved this event for
    // no reason anybody could state.
    const a = ctx.actors.find(n => isTraitor(n, ctx.ep));
    if (!a) return 0;
    const b = ctx.actors.find(n => n !== a);
    return b && !knowsAlignmentOf(a, b, ctx.ep) ? 1.5 : 0;
  },
  fire(ctx) {
    const a = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const b = ctx.actors.find(n => n !== a);
    addBond(a, b, 1);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      `${a} floated a suspicion about a fellow Traitor to ${b} — genuine-sounding enough that ${b} took it as proof ${a} couldn't be one.`);
    return { branch: 'double-bluffed', pair: [a, b], threadId: t?.id, bondDelta: 1 };
  },
});

registerEvent({
  id: 'cover-decline-recruit-offer-story',
  family: FAMILY,
  window: 'dawn',
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const debts = gs.tr?.loyaltyDebt || [];
    const actor = ctx.actors.find(n => debts.some(d => d.recruiter === n));
    return actor ? 1.5 : 0;
  },
  fire(ctx) {
    const debts = gs.tr?.loyaltyDebt || [];
    const actor = ctx.actors.find(n => debts.some(d => d.recruiter === n));
    const t = openThread(FAMILY, [actor], ctx.ep,
      `${actor} had a whole cover story ready for where they'd been the night they made that offer. Nobody had even asked.`);
    return { branch: 'recruit-story-covered', actor, threadId: t?.id };
  },
});

const ALIBI_CRUMBLE_LINES = {
  holds: [
    '{a}\'s cover story took a real question and shrugged it off without a wobble.',
    'Somebody tried to pull at {a}\'s alibi. It didn\'t give.',
  ],
  wobbles: [
    '{a}\'s alibi survived, but it took an extra beat longer than it should have.',
    'There was a small gap in {a}\'s story that {a} had to paper over out loud.',
  ],
  collapses: [
    '{a}\'s cover story came apart the moment someone actually pushed on it.',
    'The alibi didn\'t survive contact — {a} had to abandon it mid-sentence.',
  ],
};

registerEvent({
  id: 'cover-alibi-crumbles',
  family: FAMILY,
  window: 'after-table',
  advancesThread: true,
  rare: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    if (!actor) return 0;
    const t = findOpenThread(FAMILY, [actor]);
    return t ? 2 : 0;
  },
  fire(ctx, rng) {
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const partner = ctx.actors.find(n => n !== actor) || null;
    const st = pStats(actor);
    const holdsScore = (st.strategic / 10) * 0.4 + (st.temperament / 10) * 0.4 + 0.1;
    const wobblesScore = 0.35;
    const collapsesScore = (1 - st.temperament / 10) * 0.5 + (1 - st.strategic / 10) * 0.2;
    const total = holdsScore + wobblesScore + collapsesScore;
    const roll = rng() * total;
    let branch;
    if (roll < holdsScore) branch = 'holds';
    else if (roll < holdsScore + wobblesScore) branch = 'wobbles';
    else branch = 'collapses';

    let line = pick(rng, ALIBI_CRUMBLE_LINES[branch]).replace('{a}', actor);
    let bondDelta = 0;
    if (partner) {
      bondDelta = branch === 'holds' ? 0.5 : branch === 'wobbles' ? -0.5 : -2;
      if (bondDelta) addBond(actor, partner, bondDelta);
    }
    const t = findOpenThread(FAMILY, [actor]);
    const advanced = t ? advanceThread(t.id, ctx.ep, line) : openThread(FAMILY, [actor], ctx.ep, line);
    return { branch, actor, partner, threadId: advanced?.id, bondDelta };
  },
});

registerEvent({
  id: 'cover-blend-with-victims-friends',
  family: FAMILY,
  window: 'after-table',
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // Again: the Traitor is whichever of the two IS one (not whichever was
    // drawn first), and `b` is somebody they know is outside the pact — read
    // off `a`'s knowledge, never off `b`'s hidden alignment.
    const a = ctx.actors.find(n => isTraitor(n, ctx.ep));
    if (!a) return 0;
    const b = ctx.actors.find(n => n !== a);
    if (!b || knowsAlignmentOf(a, b, ctx.ep)) return 0;
    return gs?.tr?.rounds?.some(r => r.ep === ctx.ep - 1 && r.murdered) ? 2 : 0;
  },
  fire(ctx) {
    const a = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const b = ctx.actors.find(n => n !== a);
    addBond(a, b, 1);
    const t = openThread(FAMILY, [a, b], ctx.ep,
      `${a} sat with ${b} and helped them grieve — the same night's work ${a} had a hand in causing.`);
    return { branch: 'blended-in', pair: [a, b], threadId: t?.id, bondDelta: 1 };
  },
});

registerEvent({
  id: 'cover-feign-fear',
  family: FAMILY,
  window: 'morning',
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    return actor && livingFaithfuls(ctx.ep).length ? 1 : 0;
  },
  fire(ctx) {
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const t = openThread(FAMILY, [actor], ctx.ep,
      `${actor} performed the exact right amount of fear at breakfast — no more, no less than anyone else.`);
    return { branch: 'feigned-fear', actor, threadId: t?.id };
  },
});

registerEvent({
  id: 'cover-swap-story-with-partner',
  family: FAMILY,
  window: 'dawn',
  advancesThread: true,
  // THE ONE PLACE IN THIS FILE WHERE THE SECOND NAME IS NOT READ OFF GROUND
  // TRUTH (whole-plan review, finding 3). Every other event here gates on the
  // ACTOR's own role, which is self-knowledge and costs nothing. This one
  // gates on a PAIR and then spends +1 bond on it, and bonds feed
  // bondResistance() -> suspicion() in the deduction layer — so a truth-keyed
  // pair bonus is a ground-truth channel into the room's reasoning, arriving
  // by the one route Task 4's whole apparatus does not watch. The pact is
  // still the precondition; it is now read through what `a` KNOWS (the turret,
  // via knowsAlignmentOf) rather than through what `b` IS.
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    return isTraitor(a, ctx.ep) && knowsAlignmentOf(a, b, ctx.ep) ? 2 : 0;
  },
  fire(ctx) {
    const [a, b] = ctx.actors;
    addBond(a, b, 1);
    const existing = findOpenThread(FAMILY, [a, b]);
    const note = `${a} and ${b} ran their stories past each other before anyone else was awake, and smoothed out the parts that didn't match.`;
    const t = existing ? advanceThread(existing.id, ctx.ep, note) : openThread(FAMILY, [a, b], ctx.ep, note);
    return { branch: 'synchronized', pair: [a, b], threadId: t?.id, bondDelta: 1 };
  },
});
