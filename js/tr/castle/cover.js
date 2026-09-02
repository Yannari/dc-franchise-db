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
// getBond is a PURE READ and the one bonds.js name a castle file may still
// hold; every WRITE goes through the scene API (see ./effects.js).
import { getBond } from '../../bonds.js';
import { registerEvent, isNervy } from '../events.js';
import { sceneApi, arcAdvanceCiting, arcContinue } from './effects.js';
import { findOpenThread } from '../threads.js';
import { alignmentAt, livingFaithfuls } from '../roles.js';
import { knowsAlignmentOf } from '../deduction.js';

const FAMILY = 'cover';
/**
 * Lines that do not need a partner, when there is no partner to name — and the
 * whole pool when none of them can avoid it. `pick` draws once either way, so
 * this does not perturb the rng.
 */
function _partnerSafe(pool, partner) {
  if (partner) return pool;
  const safe = pool.filter(l => !l.includes('{b}'));
  return safe.length ? safe : pool;
}


/**
 * Re-capitalise the start of every sentence.
 *
 * FOUND BY READING OUTPUT (Plan 5 Task 4 round 2). Three events fill an absent
 * partner with the stand-in "somebody" - the substitution the source rule in
 * tr-castle-reachability.test.js requires, because DELETING the clause leaves a
 * fragment. When `{b}` happens to open a sentence, the stand-in opens it in
 * lower case: "Carrie didn't hide how hard it hit them. somebody sat with them
 * and let it be quiet for a while." Every authored line already begins with a
 * capital, so this is a no-op on all of them and only ever fixes a stand-in.
 */
export function _sentenceCase(line) {
  return String(line).replace(/(^|[.!?]\s+)([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase());
}

/** Fill both tokens. An absent partner becomes an unnamed onlooker, never a hole. */
function _fillPartner(line, a, partner) {
  return _sentenceCase(line.replace(/\{a\}/g, a).replace(/\{b\}/g, partner || 'somebody'));
}

import { lineFor } from './lines.js';

const NICE_ARCHETYPES = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function isTraitor(name, ep) { return alignmentAt(name, ep) === 'traitor'; }

const PREEMPTIVE_LINES = [
  '{a} had an answer ready for a question nobody had asked yet.',
  '{a} mentioned, unprompted, where they had been last night, and then had to sit with having mentioned it.',
  'Nobody had raised it. {a} raised it themselves, cleared it up, and moved the conversation along.',
  '{a} worked out overnight what the awkward question was going to be, and had the boring answer waiting for it.',
  '{a} volunteered a detail so small nobody would ever have thought to check it, which was the whole point.',
  'The story {a} told at breakfast was answering something, and nobody at the table could have said what.',
];

registerEvent({
  id: 'cover-preemptive-alibi',
  family: FAMILY,
  window: 'morning',
  // ADVANCES AND CITES (Plan 5 Task 2). `cover|morning` held no advancer. A
  // cover story is the one thing in the castle that is EXPLICITLY cumulative
  // — its whole risk is that it has to keep matching what was already said —
  // so a Traitor building the next layer of one names the day they laid the
  // last. This is a solo thread: the party set is the Traitor alone.
    citesResidue: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    return actor ? 1.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-preemptive-alibi');
    const sceneWhy = 'had an account of the night ready before anybody asked';
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const { thread, cited } = arcContinue(api, FAMILY, [actor], ctx.ep, lineFor(PREEMPTIVE_LINES, `cover-preemptive-alibi|${ctx.ep}`, { a: actor }),
      { source: sceneWhy });
    return { branch: 'alibi-built', actor, threadId: thread?.id, cited };
  },
});

const SACRIFICE_ALLY_LINES = [
  '{a} threw suspicion at {b} in front of the room — their own ally, on purpose, to clear both their names.',
  'In front of everybody, {a} named {b}. {b} understood the manoeuvre and did not enjoy being the material for it.',
  '{a} needed the room to watch somebody, and picked the person they could most afford to be wrong about.',
  '{a} spent {b} to buy a morning of not being looked at, and did it smoothly enough that only {b} knew the price.',
  '{a} asked {b} a question in front of the room that {a} already knew the answer to.',
];

registerEvent({
  id: 'cover-suspect-own-ally',
  // `rare: true` (whole-plan review, finding 5): this gates on a state that is
  // rare by design, and events.js's guard 2 exists precisely so such an event
  // is amplified rather than buried. It was not declared, so it was buried.
  rare: true,
  family: FAMILY,
  window: 'evening',
  // ACT: TESTING. Throwing your own ally to the room to clear both names
  // needs a room already hunting somebody (so not the first days) and a
  // partner still alive to spend (so not the last). The measured centre of
  // gravity agreed before this was declared: 2 firings early, 6 middle, 1
  // late per 400 seasons.
  acts: { early: 0.6, middle: 1.5, late: 0.7 },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // The pact is read through what `a` KNOWS, not through what `b` IS — see
    // the note on cover-swap-story-with-partner.
    return isTraitor(a, ctx.ep) && knowsAlignmentOf(a, b, ctx.ep) ? 2 : 0;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'cover-suspect-own-ally');
    const sceneWhy = 'pointed the room at their own ally';
    const [a, b] = ctx.actors;
    // The misdirection is real strategy, but the FRICTION it creates is real
    // too — publicly turning on your own ally costs something even when it
    // is staged, which is why this still moves the bond down.
    api.addBond(a, b, -1, { source: sceneWhy });
    const t = api.openArc(FAMILY, [a, b],
      { source: sceneWhy, seed: lineFor(SACRIFICE_ALLY_LINES, `cover-suspect-own-ally|${ctx.ep}`, { a, b }) });
    return { branch: 'sacrificed-ally', pair: [a, b], threadId: t?.id, bondDelta: -1 };
  },
});

const PLANT_NAME_LINES = [
  '{a} found three separate ways to work {c}\'s name into casual conversation today.',
  'By the evening, four different people had heard {c}\'s name from {a} and none of them noticed where it came from.',
  '{a} never accused {c} of anything. {a} just kept putting {c} in sentences.',
  '{a} asked two people, separately, whether they had seen {c} last night. Neither had. Both remembered being asked.',
  '{a} said {c}\'s name once at breakfast, once on the stairs and once at the door, and let the room do the rest.',
  '{a} defended {c}, warmly, to somebody who had not attacked them, and left the name hanging in the air.',
];

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
    const api = sceneApi(ctx, 'cover-plant-a-name');
    const sceneWhy = 'put somebody else\'s name into the room';
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const pool = livingFaithfuls(ctx.ep).filter(n => n !== actor);
    const target = pick(rng, pool.length ? pool : livingFaithfuls(ctx.ep));
    // Residue only — NOT a belief. This is the setup a later suspicion.js
    // event can pick up on ("why does everyone keep saying that name?"); the
    // plant itself proves nothing and must not read as evidence of anything
    // to the deduction layer.
    const t = api.openArc(FAMILY, [actor],
      { source: sceneWhy, seed: lineFor(PLANT_NAME_LINES, `cover-plant-a-name|${ctx.ep}`, { a: actor, c: target }) });
    // A Traitor putting an innocent name in the room's mouth. `cruel` for what
    // it does to the target and `masterful` for how well it is done — the two
    // ledgers are the only way to say both at once. See js/tr/crowd.js.
    return { branch: 'planted', actor, target, threadId: t?.id,
      crowd: [{ name: actor, colour: 'cruel', mult: 0.5 },
        { name: actor, colour: 'masterful' }] };
  },
});

const REHEARSED_LINES = [
  '{a} told the same story again, word for word. Nobody clocked the repetition.',
  '{a} gave the account a second time and did not change a syllable of it, which is not how people remember things.',
  'Asked again, {a} produced the identical version — same details, same order, same small joke in the middle.',
  '{a} had said it enough times now that it came out smooth, and smooth was the risk.',
  'The story had stopped being something {a} remembered and become something {a} recited.',
  '{a} used the same three words in the same three places, for the third day running.',
  'Nobody was checking any more, and {a} told it exactly the same way regardless.',
  '{a} could have said it backwards by now, and had privately checked that they could.',
];

registerEvent({
  id: 'cover-rehearsed-story-advance',
  family: FAMILY,
  window: 'dawn',
  advancesThread: true,
  // The thread is on the ACTOR, not the scene — see _threadThisEventWouldAdvance.
  threadScope: 'solo',
  // CITES (Plan 5 Task 2). "The same story again" is a claim ABOUT an earlier
  // day, and the day is the only thing that makes it a risk.
  citesResidue: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    if (!actor) return 0;
    return findOpenThread(FAMILY, [actor]) ? 2 : 0;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'cover-rehearsed-story-advance');
    const sceneWhy = 'went over their account of the night again';
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const t = findOpenThread(FAMILY, [actor]);
    const { thread, cited } = arcAdvanceCiting(api, t, ctx.ep, lineFor(REHEARSED_LINES, `cover-rehearsed-story-advance|${ctx.ep}`, { a: actor }),
      { source: sceneWhy });
    return { branch: 'rehearsed', actor, threadId: thread?.id, cited };
  },
});

const COLD_SWEAT_LINES = {
  pressed: [
    '{a} broke a small sweat on a completely ordinary follow-up question, with last night\'s votes still sitting on the table behind them.',
    'Somebody asked {a} something harmless and {a} answered it like it was the second question in a much worse conversation.',
    '{a} had been written down last night and it was showing in how carefully they were holding their hands.',
    'The question was nothing. {a}\'s face, with the room still watching them from yesterday, was not nothing.',
  ],
  calm: [
    '{a} broke a small sweat on a completely ordinary follow-up question.',
    '{a} took a beat too long over something entirely routine, and knew it while it was happening.',
    'Nothing about the question was difficult, and {a} still had to swallow before answering it.',
    '{a} laughed at the wrong volume and spent the next minute wondering who had heard it.',
  ],
  // ── TASK 7 STAGE 4: THE FORK MOVED OUT OF THE WORDING ─────────────────
  //
  // The audit's verdict was REWRITE — "one branch (`tell`) — the fork is in
  // the wording, not in the game" — and it was exactly right: `pressed` and
  // `calm` chose a POOL and returned the same branch either way, so the (event,
  // branch) table read this as one outcome and the screen answered it in one
  // register. Two more outcomes now, and they are things that happen rather
  // than ways of saying the first one: the moment is caught and covered
  // over-thoroughly, or it is turned into a joke and survives.
  overexplained: [
    '{a} answered the ordinary question and then answered it again, at length, twice more than was necessary.',
    'Nobody had asked for detail. {a} supplied a great deal of it, in order, with times attached.',
    '{a} corrected a small thing nobody had queried, and then corrected the correction.',
    '{a} explained where {a} had been for a good deal longer than anybody wanted to know.',
    'It was one question. {a} treated it as four, and answered all four, carefully.',
  ],
  'laughed-it-off': [
    '{a} made a joke about how guilty {a} must look, and it landed, and the room moved on.',
    '“Look at me, I’m clearly a murderer,” {a} said, and got a laugh, and did not have to answer the question.',
    '{a} turned the whole moment into something funny before anybody had decided it was a moment.',
    'It could have gone badly for {a} and {a} made it not, in about four words, without appearing to try.',
    '{a} named the awkwardness out loud, which is the one move that reliably kills it, and killed it.',
  ],
};

registerEvent({
  id: 'cover-cold-sweat-tell',
  family: FAMILY,
  window: 'after-table',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'social', 'strategic', 'boldness'],
    alignment: ['original-traitor', 'recruited-traitor'],
    knowledge: ['witnessed'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    if (!actor) return 0;
    // SPEC 5.3, EMOTIONAL STATE, on the actor's OWN state and their OWN role,
    // which is the one thing a castle event is allowed to know for certain.
    // A Traitor the room actually voted for last night is not composed; a
    // steady one who nobody wrote down has nothing to sweat about yet. Note
    // this WIDENS eligibility rather than only scaling it: pressure does to a
    // calm liar what a low temperament does to a nervous one.
    const nervy = isNervy(ctx.state?.[actor]);
    if (pStats(actor).temperament < 4) return nervy ? 3 : 2;
    return ctx.state?.[actor] === 'desperate' ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-cold-sweat-tell');
    const sceneWhy = 'gave something away while being asked about the night';
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const pressed = isNervy(ctx.state?.[actor]);
    const st = pStats(actor);
    // FOUR OUTCOMES, AND THE STATE STILL CHOOSES BETWEEN TWO OF THEM. Somebody
    // the room came for last night sweats differently from somebody it did
    // not, which is what `pressed`/`calm` was for and is kept — it is now the
    // split INSIDE the branch that goes badly rather than the whole fork.
    const scores = {
      tell: (1 - st.temperament / 10) * 0.5 + 0.2,
      overexplained: (1 - st.social / 10) * 0.35 + (st.strategic / 10) * 0.3,
      'laughed-it-off': (st.social / 10) * 0.45 + (st.boldness / 10) * 0.3,
    };
    const total = Object.values(scores).reduce((s, v) => s + v, 0);
    let roll = rng() * total;
    let branch = 'tell';
    for (const k of Object.keys(scores)) { roll -= scores[k]; if (roll <= 0) { branch = k; break; } }
    const pool = branch === 'tell' ? COLD_SWEAT_LINES[pressed ? 'pressed' : 'calm']
      : COLD_SWEAT_LINES[branch];
    const note = lineFor(pool, `cover-cold-sweat-tell|${branch}|${ctx.ep}|${pressed}`, { a: actor });
    const t = api.openArc(FAMILY, [actor], { source: sceneWhy, seed: note });
    // THE BRANCH IS THE MOMENT, same rule `cover-alibi-crumbles` states: a
    // recovery the room enjoys is spectacle, a visible tell is exposure.
    const colour = branch === 'laughed-it-off' ? 'masterful'
      : branch === 'tell' ? 'exposed' : null;
    return { branch: branch === 'tell' ? 'tell' : branch, actor, threadId: t?.id,
      underPressure: pressed, crowd: colour ? { name: actor, colour } : null };
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
    '{a} was so unremarkable about it that {b} lost interest halfway through and asked about lunch.',
    '{a} got a detail slightly wrong on purpose, corrected it, and that was what sold the whole thing.',
    '{a} told it flat, without a single flourish, and the room let it go by.',
  ],
  awkward: [
    '{a}\'s story had a wobble in it. Nobody happened to be listening closely enough to catch it.',
    'It wasn\'t {a}\'s best work, but it got through.',
    '{a} lost the shape of it for half a sentence and found it again before anybody looked up.',
    'There was a seam in it, and {a} talked straight over the seam.',
  ],
  suspicious: [
    '{a}\'s answer came a half-second too fast, and at least one person in the room noticed.',
    '{a} was helpful about it. {a} was, on reflection, quite a lot more helpful about it than anybody needed.',
    'There was a version of that answer that took ten words, and {a} used forty.',
    '{a} finished, and the pause afterwards was a beat longer than a boring answer earns.',
    'Something about the way {a} told it made {b} quietly file it away.',
    '{a} answered a question about the kitchen with an alibi for the corridor, and {b} noticed the difference.',
    '{b} had not been suspicious of {a} until {a} was quite that helpful about it.',
  ],
  slip: [
    '{a} said too much, too fast, and had to walk it back in real time.',
    'The story fell apart in {a}\'s own mouth halfway through telling it.',
    '{a} named a room, then a different room, and then tried to make both of them true.',
    '{a} corrected themselves out loud, twice, on a question about where they had been standing.',
    '{a} put themselves somewhere at a time {b} could prove they had not been, and heard it land.',
  ],
};

registerEvent({
  id: 'cover-story-check',
  family: FAMILY,
  window: 'evening',
  // ADVANCES AND CITES (Plan 5 Task 2). `cover|evening` held four events and
  // no advancer. Being asked to tell it again IS the event, and what makes
  // the retelling dangerous is the day it has to match.
  advancesThread: true,
  citesResidue: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    // ROLE IS THE ONLY GATE. Any living Traitor may attempt this — a hero
    // who took the recruitment is exactly as eligible as a schemer. Nothing
    // here reads archetype; that only happens after eligibility is decided.
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    return actor ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-story-check');
    const sceneWhy = 'had their account of the night checked';
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

    // NO PARTNER, NO DANGLING CLAUSE (found by reading output, review round 3).
    // This used to strip from `{b}` to the end of the sentence, which is only
    // correct when `{b}` STARTS one. "Something about the way {a} told it made
    // {b} quietly file it away." became "…told it made ." — a sentence ending
    // on its own verb, which Task 2's citations then quoted into later beats.
    // Prefer a line that never mentions a partner; fall back to an unnamed
    // onlooker, which is true (the room is still there) and always grammatical.
    let line = _fillPartner(pick(rng, _partnerSafe(OUTCOME_LINES[branch], partner)), actor, partner);

    const parties = partner ? [actor, partner] : [actor];
    let bondDelta = 0;
    if (branch === 'convincing' && partner) bondDelta = 1;       // sold it together
    else if (branch === 'suspicious' && partner) bondDelta = -1; // partner half-clocked it
    else if (branch === 'slip' && partner) bondDelta = -2;       // partner had to watch it fall apart
    if (bondDelta) api.addBond(actor, partner, bondDelta, { source: sceneWhy });

    const { thread, cited } = arcContinue(api, FAMILY, parties, ctx.ep, line, { source: sceneWhy });
    return { branch, actor, partner, archetype, isNiceButTraitor: NICE_ARCHETYPES.includes(archetype),
      competence, threadId: thread?.id, cited, bondDelta };
  },
});

// ── Task 6 additions ────────────────────────────────────────────────────

const DOUBLE_BLUFF_LINES = [
  '{a} floated a suspicion about a fellow Traitor to {b} — genuine-sounding enough that {b} took it as proof {a} couldn\'t be one.',
  '{a} handed {b} a real name off the turret and let {b} think they had found it themselves.',
  'The safest thing {a} said all day was the truth, aimed at somebody {a} could afford to lose.',
  '{a} told {b} they were frightened of one of the Traitors by name, and {b} filed {a} under the frightened.',
  'Nobody suspects the person doing the suspecting. {a} spent the evening making sure {b} understood that about {a}.',
];

registerEvent({
  id: 'cover-double-bluff',
  family: FAMILY,
  window: 'evening',
  // The second advancer in `cover|evening`.
  advancesThread: true,
  citesResidue: true,
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
    const api = sceneApi(ctx, 'cover-double-bluff');
    const sceneWhy = 'raised the suspicion about themselves first';
    const a = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const b = ctx.actors.find(n => n !== a);
    api.addBond(a, b, 1, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, FAMILY, [a, b], ctx.ep, lineFor(DOUBLE_BLUFF_LINES, `cover-double-bluff|${ctx.ep}`, { a, b }),
      { source: sceneWhy });
    return { branch: 'double-bluffed', pair: [a, b], threadId: thread?.id, cited, bondDelta: 1,
      crowd: { name: a, colour: 'masterful' } };
  },
});

const RECRUIT_COVER_LINES = [
  '{a} had a whole account ready for where they\'d been the night they made that offer. Nobody had even asked.',
  '{a} has an account of that night ready to go, polished, unrequested, and gathering dust.',
  'Somewhere in {a}\'s head is a very good explanation for a conversation nobody knows happened.',
  '{a} keeps almost bringing up that night and then not bringing it up.',
  '{a} rehearsed it once more in the mirror, for an audience that has not asked and might never.',
];

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
    const api = sceneApi(ctx, 'cover-decline-recruit-offer-story');
    const sceneWhy = 'explained away the night they were approached';
    const debts = gs.tr?.loyaltyDebt || [];
    const actor = ctx.actors.find(n => debts.some(d => d.recruiter === n));
    const t = api.openArc(FAMILY, [actor],
      { source: sceneWhy, seed: lineFor(RECRUIT_COVER_LINES, `cover-decline-recruit-offer-story|${ctx.ep}`, { a: actor }) });
    return { branch: 'recruit-story-covered', actor, threadId: t?.id };
  },
});

const ALIBI_CRUMBLE_LINES = {
  holds: [
    '{a}\'s account took a real question and shrugged it off without a wobble.',
    'Somebody tried to pull at {a}\'s alibi. It didn\'t give.',
    'Two people came at {a}\'s account from two directions and it was the same account both times.',
    '{a} invited them to check it, which is the last thing anybody does with a story that will not hold.',
  ],
  wobbles: [
    '{a}\'s alibi survived, but it took an extra beat longer than it should have.',
    'There was a small gap in {a}\'s story that {a} had to paper over out loud.',
    '{a} had to add a sentence that had not been in it yesterday, and the addition was audible.',
    'The alibi held, but {a} had to hold it, and holding it was visible work.',
  ],
  collapses: [
    '{a}\'s account came apart the moment someone actually pushed on it.',
    'The alibi didn\'t survive contact — {a} had to abandon it mid-sentence.',
    'Somebody had been in that corridor too, and said so, and there was nothing left of {a}\'s version.',
    '{a} tried a third variant, in front of everybody, and it was worse than the second.',
  ],
};

registerEvent({
  id: 'cover-alibi-crumbles',
  family: FAMILY,
  window: 'after-table',
  advancesThread: true,
  // The thread is on the ACTOR, not the scene — see _threadThisEventWouldAdvance.
  threadScope: 'solo',
  rare: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    if (!actor) return 0;
    const t = findOpenThread(FAMILY, [actor]);
    return t ? 2 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-alibi-crumbles');
    const sceneWhy = 'their account of the night stopped holding';
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

    let line = pick(rng, ALIBI_CRUMBLE_LINES[branch]).replace(/\{a\}/g, actor);
    let bondDelta = 0;
    if (partner) {
      bondDelta = branch === 'holds' ? 0.5 : branch === 'wobbles' ? -0.5 : -2;
      if (bondDelta) api.addBond(actor, partner, bondDelta, { source: sceneWhy });
    }
    const t = findOpenThread(FAMILY, [actor]);
    const advanced = t
      ? api.advanceArc(t.id, line, { source: sceneWhy })
      : api.openArc(FAMILY, [actor], { source: sceneWhy, seed: line });
    // THE BRANCH IS THE MOMENT. A story that holds is the villain being good
    // at this; one that collapses is the villain sweating, which the crowd
    // enjoys more and warms to slightly. A wobble is neither.
    const colour = branch === 'holds' ? 'masterful' : branch === 'collapses' ? 'exposed' : null;
    return { branch, actor, partner, threadId: advanced?.id, bondDelta,
      crowd: colour ? { name: actor, colour } : null };
  },
});

// ── TASK 7 STAGE 4: REWRITTEN OFF THE AUDIT'S REWRITE LIST ────────────
//
// One branch (`blended-in`) became four, and the four are four different
// results of the same attempt rather than four ways of describing a success.
// Sitting in with the people who have lost somebody is a PERFORMANCE with a
// failure mode, and the failure modes are the interesting half: doing it too
// well, doing it too much, and being quietly not wanted there.
const BLEND_LINES = {
  'blended-in': [
    '{a} sat with {b} and helped them grieve — the same night’s work {a} had a hand in causing.',
    '{a} made sure {b} ate something this morning, and meant it, and had also been in the turret.',
    '{b} cried and {a} was the one holding them, which was true and monstrous at the same time.',
    '{a} said all the right things to {b} about last night, and knew every one of them from the other side.',
    'Nobody comforted {b} better than {a} did, and nobody had less right to.',
  ],
  'overdid-it': [
    '{a} was so much the right person about it that {b} came away faintly unsure why.',
    '{a} grieved slightly harder than anybody who had known them that well, and {b} noticed the size of it.',
    'It was all correct and it was all a little too much, and {b} could not have said which part.',
    '{a} said three kind things about somebody {a} had barely spoken to, and {b} counted them.',
    '{b} was comforted and, an hour later, could not work out why the comforting had felt like an argument.',
  ],
  'was-welcomed': [
    '{b} pulled {a} in without being asked. Whatever {b} thinks, {a} is inside it now.',
    '“I’m glad it’s you,” {b} said to {a}, which is a sentence {a} is going to be carrying for a while.',
    '{b} wanted {a} there specifically, and said so, in front of other people.',
    '{a} did not have to do anything. {b} did the whole thing for {a}, out of pure grief.',
    '{b} thanked {a} for being there, and {a} said the ordinary thing back, and it worked.',
  ],
  'kept-out': [
    '{a} sat down with them and something in the shape of the group did not open up to let {a} in.',
    '{b} was perfectly polite and gave {a} nothing, and {a} left earlier than {a} had planned to.',
    '{a} said the right thing and it landed nowhere. {b} answered somebody else.',
    'There is an inside to a room like that and {a} spent twenty minutes in the doorway of it.',
    '{b} did not want {a} there and was not going to say so, and both of them understood the arrangement.',
  ],
};

registerEvent({
  id: 'cover-blend-with-victims-friends',
  family: FAMILY,
  window: 'after-table',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['social', 'temperament', 'loyalty', 'strategic'],
    alignment: ['original-traitor', 'recruited-traitor'],
    relationship: ['close-ally', 'neutral'],
  },
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
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-blend-with-victims-friends');
    const sceneWhy = 'sat in with the people who had lost somebody';
    const a = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const b = ctx.actors.find(n => n !== a);
    const st = pStats(a);
    const bond = getBond(a, b);
    const scores = {
      'blended-in': (st.social / 10) * 0.45 + (st.temperament / 10) * 0.25,
      'overdid-it': (1 - st.temperament / 10) * 0.4 + (st.strategic / 10) * 0.25,
      'was-welcomed': Math.max(0, bond) / 10 * 0.5 + (st.loyalty / 10) * 0.25,
      'kept-out': (1 - st.social / 10) * 0.4 + Math.max(0, -bond) / 10 * 0.4,
    };
    const total = Object.values(scores).reduce((s, v) => s + v, 0);
    let roll = rng() * total;
    let branch = 'blended-in';
    for (const k of Object.keys(scores)) { roll -= scores[k]; if (roll <= 0) { branch = k; break; } }
    const bondDelta = branch === 'blended-in' ? 1
      : branch === 'overdid-it' ? -0.5 : branch === 'was-welcomed' ? 2.5 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const kind = branch === 'overdid-it' || branch === 'kept-out' ? 'suspicion' : FAMILY;
    const t = api.openArc(kind, [a, b],
      { source: sceneWhy,
        seed: lineFor(BLEND_LINES[branch], `cover-blend-with-victims-friends|${branch}|${ctx.ep}`, { a, b }) });
    return { branch, pair: [a, b], speaker: a, respondent: b, threadId: t?.id, bondDelta };
  },
});

const FEIGN_FEAR_LINES = [
  '{a} performed the exact right amount of fear at breakfast — no more, no less than anyone else.',
  '{a} was frightened at precisely the average volume of the room, which took some doing.',
  '{a} let their voice go once, briefly, and then got it back, and everybody saw both halves.',
  '{a} checked what frightened looked like on the two people nearest them, and did that.',
  'The trick is not looking calm. {a} knows that, and spent breakfast not looking calm.',
];

registerEvent({
  id: 'cover-feign-fear',
  family: FAMILY,
  window: 'morning',
  // The second advancer in `cover|morning`.
    citesResidue: true,
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    return actor && livingFaithfuls(ctx.ep).length ? 1 : 0;
  },
  fire(ctx) {
    const api = sceneApi(ctx, 'cover-feign-fear');
    const sceneWhy = 'performed being frightened for the room';
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const { thread, cited } = arcContinue(api, FAMILY, [actor], ctx.ep, lineFor(FEIGN_FEAR_LINES, `cover-feign-fear|${ctx.ep}`, { a: actor }),
      { source: sceneWhy });
    return { branch: 'feigned-fear', actor, threadId: thread?.id, cited };
  },
});

const SWAP_STORY_LINES = [
  '{a} and {b} ran their stories past each other before anyone else was awake, and smoothed out the parts that didn\'t match.',
  'Before the castle was up, {a} and {b} agreed on what time it had been, and stuck to it all day.',
  '{a} and {b} found the one detail they had different and picked the duller of the two.',
  'They rehearsed it once each, {a} then {b}, and then never spoke about it again.',
  '{b} had put themselves in the wrong room. {a} noticed at dawn, and moved them.',
];

registerEvent({
  id: 'cover-swap-story-with-partner',
  // `rare: true` (whole-plan review, finding 5): this gates on a state that is
  // rare by design, and events.js's guard 2 exists precisely so such an event
  // is amplified rather than buried. It was not declared, so it was buried.
  rare: true,
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
    const api = sceneApi(ctx, 'cover-swap-story-with-partner');
    const sceneWhy = 'synchronised an account with somebody else';
    const [a, b] = ctx.actors;
    api.addBond(a, b, 1, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]);
    const note = lineFor(SWAP_STORY_LINES, `cover-swap-story-with-partner|${ctx.ep}`, { a, b });
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    return { branch: 'synchronized', pair: [a, b], threadId: t?.id, bondDelta: 1 };
  },
});


// -- PLAN 5 TASK 4: THE `night` WINDOW ----------------------------------
//
// The `night` window runs LAST in the round - after the Round Table and after
// the conclave. For a Traitor that is the one hour of the day with nobody to
// perform for, and it is the only scene in this file where the cover story is
// not being told to anybody. SOLO-CAPABLE deliberately: `_sceneActors` draws a
// single actor about 40% of the time, and a window whose whole pool demands a
// pair is a window that returns nothing on those draws.

const ALONE_LINES = {
  steady: [
    '{a} was asleep inside ten minutes. Whatever the day had cost, it was not costing this.',
    '{a} went over the day once, found nothing that needed fixing, and slept.',
    'Nobody watching would have guessed anything from how easily {a} went down that night.',
    '{a} slept the sleep of somebody with nothing on their mind, which is a skill and not an innocence.',
    'The day did not follow {a} up the stairs. It rarely does.',
    '{a} put the whole thing down at the door of the room and picked it back up in the morning.',
  ],
  sleepless: [
    '{a} lay awake running the whole day backwards, looking for the moment it had gone wrong.',
    'It was nearly light before {a} stopped rehearsing tomorrow\'s version of today.',
    '{a} counted every conversation twice and could not make the last one come out clean.',
    'Every time {a} nearly went under, the same sentence came back and sat them up again.',
    '{a} got up twice to check something nobody was going to check.',
    '{a} argued with somebody who was asleep two rooms away, at length, and lost.',
  ],
  nearly: [
    '{a} got as far as opening their mouth to say it out loud, in an empty room, and stopped.',
    'There was a moment that night where {a} genuinely nearly told somebody, and it passed.',
    '{a} said the true version once, quietly, to nobody, just to hear what it sounded like.',
    '{a} had a whole confession composed by two in the morning and nowhere to put it.',
    'It nearly came out of {a} at the bottom of the stairs, to the first person they saw, and did not.',
    '{a} got as far as the shape of the first word and turned it into something else.',
  ],
  // ── TASK 7 STAGE 4: THE FOURTH BRANCH ─────────────────────────────────
  //
  // The audit's verdict was REWRITE: three branches, and (before stage 2's
  // migration) no effects at all. The fourth is the one the other three imply
  // and none of them is — the hour is not spent surviving it, it is spent
  // WORKING, and tomorrow is built in the dark by somebody who is good at this.
  rehearsing: [
    '{a} did not try to sleep. {a} spent the hour building tomorrow, sentence by sentence, until it fitted.',
    'By two in the morning {a} had an account of the whole day that would survive being asked about twice.',
    '{a} took the version of today {a} intends to give and ran it until the seams stopped showing.',
    'It is work, and {a} did the work: what {a} saw, when, and who else could say so.',
    '{a} lay there deciding which true things to say tomorrow, which is most of the skill of it.',
    '{a} picked the two details that make an account real and made sure both of them were true ones.',
  ],
};

registerEvent({
  id: 'cover-alone-with-it',
  family: FAMILY,
  window: 'night',
  // A cover story is personal - see the note on _threadThisEventWouldAdvance
  // in events.js. Solo scope, or a two-person scene silently misses the thread.
  threadScope: 'solo',
  citesResidue: true,
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'backfire'],
    voice: ['temperament', 'strategic', 'loyalty', 'boldness'],
    alignment: ['original-traitor', 'recruited-traitor'],
  },
  weight(ctx) {
    if (!ctx.actors?.length) return 0;
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    if (!actor) return 0;
    // The night after the room came for you is a different night.
    return isNervy(ctx.state?.[actor]) ? 3 : 2;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-alone-with-it');
    const sceneWhy = 'sat alone with what they had done';
    const actor = ctx.actors.find(n => isTraitor(n, ctx.ep));
    const st = pStats(actor);
    // Competence at carrying it, not permission to have it.
    const steadyScore = (st.temperament / 10) * 0.6 + (st.strategic / 10) * 0.3;
    const sleeplessScore = (1 - st.temperament / 10) * 0.6 + 0.2;
    const nearlyScore = (st.loyalty / 10) * 0.5 + (1 - st.boldness / 10) * 0.3;
    const rehearsingScore = (st.strategic / 10) * 0.5 + (st.mental / 10) * 0.35;
    const total = steadyScore + sleeplessScore + nearlyScore + rehearsingScore;
    const roll = rng() * total;
    let branch;
    if (roll < steadyScore) branch = 'steady';
    else if (roll < steadyScore + sleeplessScore) branch = 'sleepless';
    else if (roll < steadyScore + sleeplessScore + nearlyScore) branch = 'nearly';
    else branch = 'rehearsing';

    const line = pick(rng, ALONE_LINES[branch]).replace(/\{a\}/g, actor);
    const { thread, cited } = arcContinue(api, FAMILY, [actor], ctx.ep, line, { source: sceneWhy });
    return { branch, actor, threadId: thread?.id, cited, state: ctx.state?.[actor] || 'content' };
  },
});
