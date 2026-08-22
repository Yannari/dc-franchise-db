// ══════════════════════════════════════════════════════════════════════
// bb-finale.js — the last night in the house
// ══════════════════════════════════════════════════════════════════════
//
// From the final three: a three-part Head of Household, the winner of it cutting
// one person loose, and then the jury — the people this house has spent a season
// evicting — deciding which of the last two played it better.
//
// The jury vote itself is Total Drama's. Its model already reads exactly what a
// jury should read: what a juror personally values in a game, their resentment,
// their respect, whether they believe a finalist is the reason they are sitting
// there. All of that is canonical shared state that Big Brother has been filling
// in all season, so the work here is seating the jury and handing it over rather
// than writing a second opinion about how juries think.

import { gs, seasonConfig } from './core.js';
import { themeBeat, themeState } from './bb/themes.js';
import { pStats, pronouns } from './players.js';
import { getBond } from './bonds.js';
import { dealBetween, sincerityOf, honoursDeal, breakDeal, exposeDeal, tierOf } from './bb/deals.js';
import { reconcileBBJury } from './bb/knowledge.js';
import { seedJurorReads, sentimentAdjustment } from './bb/jury-sentiment.js';
import { runJuryQuestioning, runReunion, runClosingStatements, runAmericasFavourite } from './bb/finale-night.js';
import { seatedJurors } from './bb/jury.js';
import { rememberStrategy } from './strategy-memory.js';
import { simulateJuryVote } from './finale.js';
import { runBBCompetition } from './bb/comps.js';
import { BB_COMPETITIONS } from './bb-comps/index.js';
import { generateBBFinaleHouse } from './bb/finale-house.js';
import { generateBBEvictionInterview } from './bb-aftermath.js';

// ── the last pitch ──────────────────────────────────────────────────────
//
// Written here rather than in the screen that draws it, for the reason
// finale-house.js already gives about its own lines: two writers describing one
// scene differently is how a reader ends up with two seasons. The transcript
// and the VP now print the same sentence because there is only one.
//
// Chosen by a hash of the week and the name rather than by the finale's rng, so
// adding this does not shift a single downstream draw in a seeded season.
const _pitchHash = (...parts) => {
  const key = parts.join('|');
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
};

const PITCH_DEAL = [
  (n, h) => `${n} does not make a speech. ${n} says the week and the room it was agreed in, and lets ${h} sit with it. "You know what you said to me. I've never once made you wonder if I meant it."`,
  n => `"I'm not going to sell you anything," ${n} says. "We shook on this. I kept my end every single week, including the weeks it cost me. That's the whole pitch."`,
  (n, h) => `${n} pitches the promise itself. "Everybody on that jury has been lied to by somebody. Don't make me one of them, because they'll ask, and I'll have to answer."`,
  n => `"You can beat me," ${n} says, which is a strange thing to lead with. "But you told me you wouldn't have to think about it. I'm asking you not to think about it."`,
];

const PITCH_WEAK = [
  n => `${n} argues the arithmetic, openly. "I haven't won anything. I haven't put anybody on that jury. Sit next to me and you get to say all of that out loud."`,
  n => `"Take the person you can beat," ${n} says. "I'd like to pretend that isn't me. It's me."`,
  (n, h, p) => `${n} makes the case ${p.sub} has been quietly building for weeks: that ${p.sub} is the safe half of any final two, and safe is worth more tonight than loyal.`,
  n => `"Nobody in that jury room is angry at me," ${n} says. "Nobody's grateful either. That's exactly what you want sitting beside you."`,
];

const PITCH_STRONG = [
  n => `${n} does not pretend to be beatable. "I've played a game you're going to have to answer for. So have you. Let's go answer for them together and let them pick."`,
  n => `"You want the easy one," ${n} says. "I get it. But the jury respects a final two that actually happened, and half of them will punish you for ducking it."`,
  (n, h, p) => `${n} puts the season on the table — the wins, the weeks on the block, the votes ${p.sub} survived — and dares ${h} to sit beside it.`,
  n => `"If you cut me you'd better win," ${n} says, evenly. "Because I'll be on that jury in about four minutes, and I vote."`,
];

/**
 * What each of the two says to the one person who can act on it.
 *
 * Not a plea to a house — a plea to a finalist, about a jury. Which register
 * they get is what they can truthfully offer: a deal already made, a jury they
 * can be beaten by, or nothing except having played.
 */
function finalPitches({ hoh, options, margins, honoured, betrayal, week }) {
  // Two people, one pool, and a hash that can land on the same line twice —
  // which it did: both of them "did not pretend to be beatable", in the same
  // words, one paragraph apart, in the segment whose whole premise is that
  // these are two different cases. Whoever speaks second steps to the next
  // unused line in their own pool.
  const used = new Set();
  return options.map(name => {
    const p = pronouns(name);
    const hasDeal = honoured?.partner === name || betrayal?.partner === name;
    const other = options.find(n => n !== name);
    const weaker = (Number(margins.get?.(name) ?? margins[name]) || 0)
      < (Number(margins.get?.(other) ?? margins[other]) || 0);
    const pool = hasDeal ? PITCH_DEAL : weaker ? PITCH_WEAK : PITCH_STRONG;
    const kind = hasDeal ? 'the deal' : weaker ? 'the arithmetic' : 'the resume';
    let at = _pitchHash(week, name, kind) % pool.length;
    for (let step = 0; step < pool.length && used.has(pool[at]); step++) {
      at = (at + 1) % pool.length;
    }
    const line = pool[at];
    used.add(line);
    return { name, kind, text: line(name, hoh, p) };
  });
}

/** Everyone still playing, in roster order. */
const houseNow = () => [...(gs.activePlayers || [])];

const finalePick = (rng, lines) => lines[Math.floor(rng() * lines.length)];


/**
 * The count the final Head of Household does in their OWN head.
 *
 * This replaces a projectJuryVotes call that read the Total Drama jury store,
 * which Big Brother only fills AFTER this decision — so the "who can I beat"
 * reading returned an empty object, every margin was zero, keeping a promise
 * never appeared to cost anything, and a final-two deal was honoured in twenty
 * seasons out of twenty. The one spot the whole season aims at was being
 * decided by a function looking at an empty bench.
 *
 * It is deliberately NOT a fixed version of that projection. The real vote
 * runs on things no houseguest can see — jury-house blowups, sentiment
 * adjustments, per-juror private reads — and handing those to the HOH would
 * be an oracle wearing a bandana. This count uses only what a player in that
 * chair actually has:
 *
 *   - friendships they watched form (bonds between jurors and finalists were
 *     lived in front of them);
 *   - the memory wall (competition wins and survived evictions are public);
 *   - dirt that went PUBLIC — broken deals count only for jurors they were
 *     exposed to, private grudges stay invisible;
 *   - the rulebook: whoever they cut is the last juror, and arrives bitter
 *     at the person who cut them;
 *   - and a blur over the whole thing scaled by their own intuition, because
 *     a bad reader of people does this math confidently and wrong.
 *
 * Returns { margin, count } — margin is believed votes for the HOH minus
 * believed votes against, over the jury that would exist if `other` sits
 * beside them (so the third houseguest is counted as the juror they become).
 */
function hohJuryCount(hoh, other, thirdWheel, rng = Math.random) {
  const bench = [...new Set([...seatedJurors(), thirdWheel].filter(n => n && n !== hoh && n !== other))];
  if (!bench.length) return { margin: 0, count: {} };
  const stats = n => gs.bb?.stats?.[n] || {};
  const resume = n => (stats(n).hohWins || 0) + (stats(n).vetoWins || 0)
    + (stats(n).blockBusterWins || 0) + Math.min(3, (stats(n).timesOnTheBlock || 0)) * 0.3;
  const publicDirt = (finalist, juror) => (gs.sideDeals || [])
    .filter(d => d.broken && d.brokenBy === finalist
      && ((d.exposedTo || []).includes(juror) || (d.players || []).includes(juror))).length;
  const blur = (1 - Math.min(1, (pStats(hoh).intuition || 5) / 10)) * 1.6;
  const count = { [hoh]: 0, [other]: 0 };
  for (const juror of bench) {
    let lean = (getBond(juror, hoh) - getBond(juror, other)) * 0.55
      + (resume(hoh) - resume(other)) * 0.35
      + (publicDirt(other, juror) - publicDirt(hoh, juror)) * 0.9;
    // The juror this cut creates. Every real player prices this in: the last
    // seat on the bench is filled by the person you personally sent to it.
    if (juror === thirdWheel) lean -= 1.8;
    lean += (rng() - 0.5) * 2 * blur;
    count[lean >= 0 ? hoh : other]++;
  }
  return { margin: count[hoh] - count[other], count };
}

/** Turn the ordinary eviction interview shell into the much rawer final-three exit. */
function finalThreeInterview(base, { cut, finalHoh, kept, betrayal, honoured }, rng) {
  if (!base || !cut) return base;
  const cp = pronouns(cut);
  const hp = pronouns(finalHoh);
  const bondToHoh = getBond(cut, finalHoh);
  const bondToKept = getBond(cut, kept);
  const stats = gs.bb?.stats?.[cut] || {};
  const hohs = Number(stats.hohWins) || 0;
  const vetos = Number(stats.vetoWins) || 0;
  const blocks = Number(stats.timesOnTheBlock ?? stats.timesNominated) || 0;
  const wouldTake = bondToHoh >= bondToKept ? finalHoh : kept;
  const host = base.host || seasonConfig.host || 'Don';

  const cutAnswer = betrayal
    ? finalePick(rng, [
      `"It cost ${finalHoh} my trust in real time. Whether it costs ${hp.obj} my vote depends on whether ${hp.sub} can own it without calling it loyalty."`,
      `"I can respect the move and still hate that it was done to me. ${finalHoh} promised me that chair. Now ${hp.sub} gets to explain to the jury why the promise stopped mattering."`,
      `"The cut is good if ${hp.sub} wins. If ${hp.sub} loses my vote doing it, then it was just dramatic."`,
    ])
    : honoured
      ? finalePick(rng, [
        `"I knew the promise mattered. I just spent all day hoping the money would matter more."`,
        `"${finalHoh} kept ${hp.posAdj} word. Unfortunately, ${hp.posAdj} word was to somebody else."`,
        `"I cannot call it dirty. I can call it devastating. Those are different things."`,
      ])
      : finalePick(rng, [
        `"I knew it was possible. Knowing the knife is in the room does not make it hurt less when somebody uses it."`,
        `"I thought my jury case made me valuable. Apparently it made me luggage."`,
        `"It was the clean move. I hate that I understand it, because being furious would be much easier."`,
      ]);

  const voteAnswer = betrayal || bondToHoh <= -2
    ? finalePick(rng, [
      `"Not tonight. Ask me again after the questions. If ${finalHoh} wants my vote, ${hp.sub} can earn it in public."`,
      `"I am not rewarding a speech that pretends this did not happen. If ${hp.sub} owns it and proves it was necessary, then we can talk."`,
      `"I walked out angry, not stupid. I will vote for the better game. ${finalHoh} has made the burden of proof very expensive."`,
    ])
    : finalePick(rng, [
      `"Yes. I do not have to like the decision to respect the game behind it."`,
      `"If ${finalHoh} answers honestly and the résumé is there, yes. This vote is for the season, not the last five minutes."`,
      `"I can. Cutting me may be the best move ${hp.sub} made. I would prefer not to admire it this soon."`,
    ]);

  const proud = finalePick(rng, [
    `"I made final three with ${hohs} HOH win${hohs === 1 ? '' : 's'}, ${vetos} veto${vetos === 1 ? '' : 'es'}, and ${blocks} trip${blocks === 1 ? '' : 's'} to the block. Nobody carried me to that front door."`,
    `"I kept finding a way back into the room. Wins, deals, ugly votes—whatever the week demanded. One decision ended me; the house could not do it before tonight."`,
    `"People had to plan around me. Even tonight, the winning move was apparently making sure I never reached those two chairs. That is a painful compliment, but I will take it."`,
  ]);

  const hohGoodbye = betrayal
    ? `"I made you a promise, and tonight I broke it. I am not going to insult you by dressing that up. I believed I could not beat you, so I chose the money over my word. You have every right to make me answer for it."`
    : `"You deserved that chair. I also believed you could beat me in it. This was the hardest decision I made all season, and I made it because I came here to win—not to finish second beside somebody I love."`;
  const keptGoodbye = finalePick(rng, [
    `"There is no graceful way to celebrate while you are walking out. I am sorry it was you, and I am grateful it was not me. Both things are true."`,
    `"You made this house harder, smarter, and considerably louder. I wanted the seat. I never wanted to watch you lose yours."`,
    `"I owe you more than a goodbye message and less than my seat. That is an awful sentence, but finale night is full of them."`,
  ]);

  return {
    ...base,
    joinsJury: true,
    juryNumber: (gs.jury?.length || 0) + 1,
    hostLines: {
      ...(base.hostLines || {}),
      truth: `"There is no hidden vote to reveal. One person made this decision, and that person is still sitting inside."`,
      goodbyes: `"Before you take the final seat on the jury, ${finalHoh} and ${kept} recorded messages for you."`,
    },
    questions: [
      { q: `${cut}, you were one decision from the final two. What did ${finalHoh}'s decision cost?`, a: cutAnswer },
      { q: `Be honest: if you had won Part Three, who would you have taken?`, a: `"${wouldTake}. That was my path. Maybe admitting it makes ${finalHoh}'s move look better; I am not going to rewrite my game because I lost it."` },
      { q: `You are now the final juror. Can you still vote for the person who just evicted you?`, a: voteAnswer },
      { q: `When the anger wears off, what are you proudest of?`, a: proud },
    ],
    goodbyes: [
      { name: finalHoh, tone: betrayal ? 'confession' : 'unapologetic', against: true, text: hohGoodbye,
        react: betrayal ? `${cut} laughs once at the phrase “chose the money.” There is no humour in it.` : `${cut} nods. It is the answer ${cp.sub} expected and still did not want.` },
      { name: kept, tone: 'warm', against: false, text: keptGoodbye,
        react: `${cut} looks down, smiles despite ${cp.obj}self, and tells the dark monitor, "You had better make it worth it."` },
    ],
    parting: finalePick(rng, [
      `"I missed the final two by one question and one vote. Now I get one last vote of my own. That feels fair enough to be cruel."`,
      `"They ended my game five minutes before the jury started asking questions. Convenient for them. I am still asking mine."`,
      `"No confetti for me. I do get a front-row seat on that jury and a vote to go with it, so neither finalist should relax yet."`,
      `"Third place is first place with terrible timing. I will see them at the jury chairs."`,
    ]),
    host,
  };
}

/**
 * Seat the jury from the people this season evicted.
 *
 * Total Drama's jury vote reads gs.jury and gs.jurorHistory — who was evicted,
 * and who voted them out. A house records exactly that in its ballots every
 * week, so the history is translated rather than invented, the same way the
 * ballots already translate for the vote screen.
 */
export function seatBBJury(extra = []) {
  const weeks = gs.bb?.weeks || [];
  // An eviction that a Battle Back undid is not a jury seat. The week keeps
  // its record — the vote happened and the transcript still says so — but it
  // stops counting as a departure, or the returnee ends up on the jury they
  // are still playing against. A second eviction later has its own week entry
  // and seats them properly.
  //
  // Which evictions are seats is bb/jury.js's rule now, so a mid-season reader
  // and this vote cannot disagree about who is on the panel. The trailing slice
  // stays as a belt-and-braces clamp: `extra` carries the final-three cut, and
  // a season that returned somebody through a Battle Back can otherwise arrive
  // here with one more name than there are chairs.
  const evicted = seatedJurors();
  const size = Math.max(0, Number(seasonConfig.jurySize) || 9);
  const all = [...evicted, ...extra].filter(Boolean);
  const jury = size ? all.slice(-size) : all;

  gs.jurorHistory ||= {};
  for (const w of weeks) {
    if (!w.evicted || w.evictionReversed || !jury.includes(w.evicted)) continue;
    gs.jurorHistory[w.evicted] = {
      ep: w.num,
      voters: (w.ballots || []).filter(b => b.evict === w.evicted).map(b => b.voter),
      finalBonds: Object.fromEntries((w.houseAtStart || [])
        .filter(n => n !== w.evicted)
        .map(n => [n, getBond(w.evicted, n)])),
    };
  }
  // Anyone cut at the final three was not voted out by a house, so record the
  // person who actually made the decision.
  for (const name of extra) {
    if (!jury.includes(name)) continue;
    gs.jurorHistory[name] ||= { ep: (gs.bb?.weeks?.length || 0) + 1, voters: [], finalBonds: {} };
  }

  gs.jury = jury;
  return jury;
}

/**
 * What the jury will credit a finalist with having actually done.
 *
 * The shared vote applies a passenger penalty when a finalist has no big moves
 * to their name, and a house measures those differently from an island: winning
 * when you had to, landing a backdoor, and moving a vote that was not going your
 * way.
 */
function recordBigMoves(finalists) {
  gs.playerStates ||= {};
  const weeks = gs.bb?.weeks || [];
  for (const name of finalists) {
    const st = gs.bb?.stats?.[name] || {};
    const backdoors = weeks.filter(w => w.hoh === name && w.plan?.backdoorTarget
      && w.evicted === w.plan.backdoorTarget).length;
    const flips = weeks.reduce((n, w) =>
      n + (w.ballots || []).filter(b => b.changed && b.changedBy === name).length, 0);
    // Organizing the vote that sent somebody home is the modern resume's
    // spine — juries in the big-move era credit the person who RAN the week,
    // not only the person who won the comp. Without this line a strategist
    // who orchestrated five evictions sat in the final chairs reading as a
    // passenger.
    const delivered = weeks.filter(w => (w.voteOperation?.plans || []).some(p =>
      p.organizer === name && p.target === w.evicted && p.expected >= p.majority)).length;
    gs.playerStates[name] ||= {};
    gs.playerStates[name].bigMoves = (st.hohWins || 0) + (st.vetoWins || 0) * 0.5
      + backdoors * 2 + flips + delivered * 1.5;
  }
}

/**
 * One part of the three-part final competition.
 *
 * Parts one and two DRAW, from the whole roster: every endurance competition
 * the library has can be a part one, every physical or precision one can be a
 * part two, and the set pieces written specifically for finale night sit in
 * that pool alongside them rather than replacing it. A finale that always
 * played the same wall would be the twelfth week of the season with a bigger
 * light rig, and the library exists precisely so it does not have to be.
 *
 * Part three does not draw. It is the jury quiz, every season, because the
 * question part three asks — how well do you know the people you evicted — is
 * the only one worth deciding a season on.
 */
export const FINAL_ROLES = {
  endurance: { categories: ['endurance'] },
  skill: { categories: ['physical', 'precision', 'puzzle'] },
};

/**
 * Everything that can serve one part of the final Head of Household.
 *
 * Exported because the Season Timeline's pickers must offer exactly what the
 * finale can actually run. A dropdown built from a second, hand-kept list is a
 * dropdown that eventually offers a competition the night refuses to stage.
 */
/**
 * Can this competition be staged for two or three individuals?
 *
 * The old test was `types.includes('hoh')`, which is a question about which
 * NIGHT a competition airs on, not about whether it can be played — and roughly
 * half the library is slot-exclusive, so it threw away every veto-only comp for
 * no reason a viewer could see. What actually matters here is the participant
 * contract: an arena game is written for two teams and a pair comp for couples,
 * and neither can be handed three finalists.
 */
const playableAlone = c => ['hoh', 'veto', 'tiebreaker', 'return', 'final']
  .some(t => (c.types || []).includes(t));

export function finalCompPool(role) {
  const spec = FINAL_ROLES[role] || { categories: [] };
  return BB_COMPETITIONS.filter(c =>
    // Written for finale night...
    (c.finalRole === role && c.types.includes('final'))
    // ...or an ordinary competition of the right shape, which is most of them.
    || (spec.categories.includes(c.category) && playableAlone(c)));
}

/**
 * Everything the designer may PIN to a part — which is a bigger set than what
 * the night draws on its own.
 *
 * The draw stays faithful: left alone, Part One is an endurance competition and
 * Part Two is a course, because that is what those parts are. But a pinned comp
 * is a deliberate choice, and refusing to stage a memory wall as Part Two
 * because the format usually does not is the picker overruling the person using
 * it. So the recommended set comes first and everything else the night can
 * physically run comes after it, marked as the departure it is.
 */
export function finalCompChoices(role) {
  const usual = finalCompPool(role);
  const ids = new Set(usual.map(c => c.id));
  const rest = BB_COMPETITIONS.filter(c => !ids.has(c.id) && playableAlone(c)
    // Part Three is the jury quiz and is not pinnable; offering it as a Part One
    // would stage the same competition twice in one night.
    && c.finalRole !== 'quiz');
  return { usual, rest };
}

/** What the designer pinned to this part, if anything. */
const pinnedFor = role => {
  const pins = seasonConfig?.bbFinalComps || {};
  const id = role === 'endurance' ? pins.one : role === 'skill' ? pins.two : null;
  // A pin for a competition that has since left the library is ignored rather
  // than thrown: a saved season should not stop playing because a comp was
  // renamed.
  return id && BB_COMPETITIONS.some(c => c.id === id) ? id : null;
};

function finalPart(participants, label, rng, week, { compId = null, role = null } = {}) {
  let forced = compId || (role ? pinnedFor(role) : null) || undefined;
  if (!forced && role) {
    const pool = finalCompPool(role);
    forced = pool.length ? pool[Math.floor(rng() * pool.length)].id : undefined;
  }
  // Always the `final` slot, whatever was drawn.
  //
  // This used to fall back to `hoh` for anything that was not a set piece,
  // which quietly re-imposed the restriction the pool had just been widened
  // past: pin a veto-only competition to Part Two and the dispatcher refused
  // to stage what the dropdown had offered. `final` accepts anything two or
  // three people can play (js/bb/comps.js), which is the actual rule.
  const type = 'final';
  const result = runBBCompetition({
    type, participants: [...participants], house: [...participants],
    week, rng, library: BB_COMPETITIONS, forcedId: forced, allowThrowing: false,
    // The jury quiz needs to know who is on the bench it is quoting.
    jury: [...(week?.jury || seatedJurors())],
  });
  return { part: label, competition: result, winner: result.winner, participants: [...participants] };
}

/**
 * Run the whole last night, from the final three to a winner.
 *
 * Returns an `ep`-shaped record so the run surface and the visual player treat
 * it like any other week, or null if the house is not at its final three.
 */
export function simulateBBFinale(rng = Math.random) {
  const house = houseNow();
  if (house.length < 2) return null;

  const week = { num: (gs.bb?.weeks?.length || 0) + 1, format: 'big-brother', finale: true };
  const acts = [];
  let finalTwo = [...house];
  let finalHoh = null;
  let cut = null;
  let interview = null;

  // ── the days before any of it ──
  //
  // Three people in a house built for sixteen, with nothing to win until finale
  // night: the memory wall, and two days of revising for a quiz about seven
  // jurors. It runs FIRST because it is the only part of the last week that is
  // not a competition, and because the revision figure it publishes is about
  // Part Three, which has not happened yet.
  // The season's antagonist, on the last night.
  //
  // The finale has its own simulator, so an antagonist wired only into
  // simulateBBWeek escalates all season and then is simply absent for the
  // episode everything was building to. It speaks twice here: once as the
  // night opens, once when the winner is known.
  const _themeFinale = (hook, ctx) => {
    try { const b = themeBeat(hook, { week: week.num, ...ctx }); if (b) acts.push(b); }
    catch { /* an unthemed season has nothing to say */ }
  };
  _themeFinale('finale', { finalists: [...house] });

  const finaleHouse = generateBBFinaleHouse(week, rng);
  if (finaleHouse) acts.push(finaleHouse);

  // ── what is about to happen, said out loud ──
  //
  // The night runs eight segments deep and every one of them changes what the
  // next one means: who plays part two depends on part one, who is even in the
  // final two depends on part three, and the vote at the end is cast by people
  // whose minds move in three of the segments before it. A viewer arriving at
  // the first competition with none of that explained is watching a comp with
  // no stakes attached, so the house is told the format before it plays it —
  // the same way it is on the night.
  //
  // Pins only, and no results: this is a schedule, not a spoiler.
  const pins = seasonConfig?.bbFinalComps || {};
  const pinName = id => BB_COMPETITIONS.find(c => c.id === id)?.name || null;
  if (house.length >= 3) {
    acts.push({
      type: 'finale-brief',
      finalists: [...house],
      // Two different numbers, and the screen needs both: how many are already
      // on that bench, and how many will actually vote — the seat filled after
      // Part Three counts like every other one.
      seated: seatedJurors().length,
      juryCount: seatedJurors().length + 1,
      parts: [
        { n: 1, role: 'endurance · usually', comp: pinName(pins.one),
          field: 'all three', blurb: 'Everybody plays. The winner takes a seat in Part Three and sits out Part Two entirely.' },
        { n: 2, role: 'a course · usually', comp: pinName(pins.two),
          field: 'the two who lost Part One', blurb: 'Whoever won Part One does not play. The other two go head to head for the last seat.' },
        { n: 3, role: 'the jury quiz', comp: 'Jury Statements',
          field: 'the winners of Parts One and Two', blurb: 'Every juror recorded a statement with the ending cut off. Whoever knows those people best wins the final Head of Household.' },
      ],
    });
  }

  // ── the three-part Head of Household ──
  if (house.length >= 3) {
    // Everybody plays part one, the outgoing Head of Household included, and
    // whoever wins it does not play part two at all.
    const one = finalPart(house, 'Part One', rng, week, { role: 'endurance' });
    acts.push({ type: 'final-hoh-part', ...one, partNum: 1 });

    // Whoever won part one sits it out; the other two play for the last seat.
    const twoField = house.filter(n => n !== one.winner);
    const two = finalPart(twoField, 'Part Two', rng, week, { role: 'skill' });
    acts.push({ type: 'final-hoh-part', ...two, partNum: 2 });

    // The two winners meet in part three, which is always the jury quiz.
    const three = finalPart([one.winner, two.winner], 'Part Three — The Jury Quiz', rng, week,
      { compId: 'bb-final-part-three' });
    acts.push({ type: 'final-hoh-part', ...three, partNum: 3 });
    finalHoh = three.winner;

    // The one decision the whole season has been pointing at.
    //
    // This used to be resolved on projected jury margin alone, which meant the
    // single moment in Big Brother where a final two deal is publicly honoured
    // or broken was decided by a spreadsheet. Nobody ever kept their word
    // because nobody was ever asked to.
    //
    // Now there are two readings and they can disagree. The head says take the
    // one you beat. The promise says take the one you told you would. Which one
    // wins depends on how much they meant it and how much it costs.
    const options = house.filter(n => n !== finalHoh);
    const margins = new Map(options.map(n => [n, 0]));
    let keep = options[0];
    let projected = null;
    try {
      const projections = options.map(other => {
        const third = options.find(n => n !== other) || null;
        return { other, margin: hohJuryCount(finalHoh, other, third, rng).margin };
      }).sort((a, b) => b.margin - a.margin);
      projections.forEach(p => margins.set(p.other, p.margin));
      projected = projections[0].other;
      keep = projected;
    } catch {
      // No read available: take the person the house liked least.
      keep = options.sort((a, b) =>
        house.reduce((s, n) => s + getBond(n, a), 0) - house.reduce((s, n) => s + getBond(n, b), 0))[0];
      projected = keep;
    }

    // Is there a promise here at all?
    const promises = options
      .map(other => ({ other, deal: dealBetween(finalHoh, other) }))
      .filter(entry => entry.deal);
    // Somebody holding a deal with BOTH of them has already guaranteed they
    // break one, which is the most Big Brother position there is.
    const bound = promises.sort((a, b) =>
      sincerityOf(b.deal, finalHoh) - sincerityOf(a.deal, finalHoh))[0] || null;

    let honoured = null;
    let betrayal = null;
    if (bound) {
      const partner = bound.other;
      // What keeping the promise costs: the jury margin given up by sitting
      // beside the harder opponent, scaled into 0..1.
      const cost = Math.max(0, (margins.get(projected) || 0) - (margins.get(partner) || 0));
      const pressure = Math.min(1, cost / 5);
      if (honoursDeal(finalHoh, bound.deal, pressure)) {
        keep = partner;
        // On the record, so the person they kept it with can weigh it at the
        // vote — and so can anybody who watched them do it.
        bound.deal.honoured = true;
        bound.deal.honouredBy = finalHoh;
        bound.deal.honouredEp = week.num;
        honoured = {
          partner, tier: tierOf(bound.deal), madeEp: bound.deal.madeEp,
          cost: Number(cost.toFixed(2)),
          // Keeping your word against your own interest is a different act from
          // keeping it when it was free, and the jury should hear which it was.
          costly: cost > 0.5,
        };
      } else {
        keep = projected;
        if (partner !== keep) {
          betrayal = breakDeal(bound.deal, finalHoh, { week, reason: 'cut them at the final three' });
          // Everybody on that jury is about to hear about it — this one happens
          // in front of them, at the last possible moment, on the way out.
          exposeDeal(bound.deal, [...(gs.jury || []), ...house]);
          try {
            rememberStrategy(partner, finalHoh, 'broken-final-two', week.num, 3,
              { format: 'big-brother', at: 'final-three' });
            for (const juror of gs.jury || []) {
              if (juror !== partner) rememberStrategy(juror, finalHoh, 'broke-a-final-two', week.num, 2,
                { format: 'big-brother', victim: partner });
            }
          } catch { /* the cut still happened */ }
        }
      }
    }

    cut = options.find(n => n !== keep) || null;
    finalTwo = [finalHoh, keep];
    acts.push({
      type: 'final-cut', finalHoh, kept: keep, cut,
      // The last thing either of them gets to say, written once so the screen
      // and the transcript cannot disagree about what was said.
      pitches: finalPitches({ hoh: finalHoh, options, margins, honoured, betrayal,
        week: week?.num || 0 }),
      // How they got here, because a result with no reasoning is not a story.
      projected, honoured, betrayal: betrayal ? { partner: betrayal.victims[0], tier: tierOf(bound.deal) } : null,
      hadPromise: !!bound,
      margins: Object.fromEntries(margins),
    });

    if (cut) {
      gs.activePlayers = house.filter(n => n !== cut);
      gs.eliminated ||= [];
      if (!gs.eliminated.includes(cut)) gs.eliminated.push(cut);
      // The third-place houseguest gets the same walk every other evictee got.
      //
      // Being cut one night short is the most bitter exit in the format and it
      // was the only one with no interview attached — the house generates one
      // for everybody voted out and then said nothing to the person who missed
      // the end by a single decision.
      try {
        interview = generateBBEvictionInterview(
          { ...week, eliminated: cut, houseAtStart: house },
          { ...week, houseAtStart: house, evicted: cut }, rng, cut);
        interview = finalThreeInterview(interview,
          { cut, finalHoh, kept: keep, betrayal, honoured }, rng);
      } catch { interview = null; }
    }
  }

  // ── the jury ──
  const jury = seatBBJury(cut ? [cut] : []);
  recordBigMoves(finalTwo);
  // Ponderosa. Seven people with nothing to do but compare notes about the one
  // thing none of them could see from inside: who actually wrote their name
  // down. Whatever they work out here is the last input to the only decision
  // they have left.
  let juryLearned = [];
  try { juryLearned = reconcileBBJury(jury, { week: week?.num || 0 }); } catch { juryLearned = []; }
  // The person cut at three never sat in the lodge, so they arrive with the
  // read their game earned them and nothing else — seeded here rather than
  // walking into the vote with no opinion at all.
  for (const juror of jury) {
    try { seedJurorReads(juror, week?.num || 0); } catch { /* votes on résumé alone */ }
  }

  // ── the questioning, and then the speeches ──
  //
  // Both run BEFORE the adjustments are read, which is the entire point: the
  // vote has to be counted after the room, not before it. Wrapped because a
  // finale that cannot stage its own Q&A still has to produce a winner.
  let questioning = { exchanges: [] };
  let closing = { statements: [] };
  try {
    questioning = runJuryQuestioning({ finalTwo, jury, week: week?.num || 0, rng });
    if (questioning.exchanges.length) {
      acts.push({ type: 'jury-questioning', finalTwo, jury, ...questioning });
    }
    // ── the reunion ──
    //
    // Between the questions and the speeches, because everything it reveals has
    // to still be in the room when the last word is spoken and the ballots are
    // written. Everybody who ever lived in that house comes back, and the
    // pre-jury — the only people on the stage with nothing left to protect —
    // are the reason the truth comes out at all.
    const prejury = (gs.eliminated || []).filter(n => n && !jury.includes(n) && !finalTwo.includes(n));
    const reunion = runReunion({ finalTwo, jury, prejury, week: week?.num || 0, rng });
    if (reunion.segments.length) {
      acts.push({ type: 'reunion', finalTwo, jury, prejury, ...reunion });
    }
    closing = runClosingStatements({ finalTwo, jury, week: week?.num || 0, rng });
    if (closing.statements.length) {
      acts.push({ type: 'closing-statements', finalTwo, statements: closing.statements });
    }
  } catch { /* the vote still happens */ }

  const adjustments = {};
  for (const juror of jury) {
    try { adjustments[juror] = sentimentAdjustment(juror, finalTwo); }
    catch { /* this juror votes on résumé alone */ }
  }
  const verdict = simulateJuryVote(finalTwo, adjustments);
  const votes = verdict.votes || {};

  // ── a deadlocked jury ──
  //
  // Juries are seated odd (see seatedJury), so this is the case where a season
  // could not seat enough people to make an odd panel. It still needs an
  // answer, and it used to have one by accident: `finalTwo.sort()` keeps index
  // zero when the comparator returns nought, index zero is `[finalHoh, keep]`,
  // and so every tie in this format has quietly gone to the final Head of
  // Household with nothing anywhere saying that was a rule.
  //
  // It is a rule now, and it is the same answer, because it is the right one:
  // the jury could not separate them, so it falls to the only thing decided
  // tonight rather than in the jury house — who won the last competition of
  // the season and chose the chair they are sitting in. Total Drama's ladder
  // (a revote, a shared title, a casting vote from the finalist who was cut)
  // does not transfer: this format pays one person, and the houseguest who was
  // cut is already the last juror and has already voted.
  const tiedVote = finalTwo.length === 2
    && (votes[finalTwo[0]] || 0) === (votes[finalTwo[1]] || 0);
  const winner = tiedVote
    ? finalHoh
    : finalTwo.slice().sort((a, b) => (votes[b] || 0) - (votes[a] || 0))[0];
  const runnerUp = finalTwo.find(n => n !== winner) || null;
  acts.push({ type: 'jury-vote', jury, votes, reasoning: verdict.reasoning || [], winner, runnerUp,
    // Stated, so every surface can say why a tied vote produced a winner.
    tiebreak: tiedVote
      ? { rule: 'final-hoh', winner, count: votes[finalTwo[0]] || 0,
        line: `The jury splits ${votes[finalTwo[0]] || 0}–${votes[finalTwo[1]] || 0} and cannot separate them. `
          + `It goes to ${winner}, who won the final Head of Household and chose this chair.` }
      : null,
    // What the jury house taught them, so the screen can say so.
    learned: juryLearned,
    // And who changed their mind in the chairs tonight, so the vote can be read
    // against the room rather than as an unexplained tally.
    swung: questioning.swung || [] });

  // ── America's Favourite ──
  //
  // The last thing decided, and the only one the house has no vote in.
  // `gs.popularity` has been filled in all season by competitions, camp events
  // and every heroic or cowardly moment, and nothing has ever read it at the
  // end.
  let favourite = null;
  try { favourite = runAmericasFavourite({ finalTwo, rng }); } catch { favourite = null; }
  if (favourite) acts.push({ type: 'americas-favourite', ...favourite });

  _themeFinale('crown', { finalists: [...finalTwo], winner });

  gs.phase = 'complete';
  gs.winner = winner;
  gs.bb ||= {};
  gs.bb.finale = { finalHoh, finalTwo, cut, jury, votes, winner, runnerUp, favourite,
    /* WHO EACH JUROR VOTED FOR, not just how many each finalist got. Every
       reference cast wall labels a juror with the name they wrote down —
       "Jury: Michelle" — and the tally cannot answer it. `verdict.reasoning`
       has carried it per juror all along and it stopped here. */
    juryBallots: (verdict.reasoning || [])
      .map(r => ({ juror: r.juror, votedFor: r.votedFor }))
      .filter(b => b.juror && b.votedFor) };

  return {
    num: week.num,
    format: 'big-brother',
    isBigBrother: true,
    isFinale: true,
    finale: true,
    // Without this the finale episode carries no mood, the reader falls back to
    // 'neutral', and a season that spent eight weeks escalating drops out of the
    // escalated room for the one episode it was all building to.
    themeMood: themeState()?.mood || null,
    houseAtStart: house,
    finalHoh, finalTwo, cut,
    jury, juryVotes: votes,
    winner, runnerUp, favourite,
    // Read by the shared interview screen, the same field a weekly episode uses.
    evictionInterview: interview,
    eliminated: cut || null,
    acts,
    // Total Drama's finale record shape, so anything reading a season winner
    // finds it where it expects to.
    challengeType: null, isMerge: false, riChoice: null,
    alliances: [], twists: [], tribesAtStart: [], campEvents: null,
    summaryText: '',
  };
}
