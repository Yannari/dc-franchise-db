// ══════════════════════════════════════════════════════════════════════
// tr/missions/long-account.js — The Long Account
// ══════════════════════════════════════════════════════════════════════
//
// The estate's counting room. The last owner died owing money to half the
// county, and the county's agent is here with a strongbox and no intention of
// paying twice. The castle plays the creditors: work out which debts are real,
// argue them across the table one at a time, and then decide — privately, all
// at once — whether to hold your price or take what is offered.
//
// WHY THIS AFTERNOON IS THE ONE THAT ACTUALLY HURTS. The other three missions
// are things people do TO an obstacle: sand, brass, fire. This one is a thing
// people do to each other, and the third phase is a genuine coordination
// problem rather than a stat check dressed as one. Everybody chooses HOLD or
// TAKE behind a screen. A hold pays a great deal more than a take — but only
// if enough of the team held with you, and if it fails, the people who held
// get the worst of the three outcomes and the people who took walk away with
// theirs. There is no correct answer, only a read on five other people.
//
// AND THAT IS WHY IT IS THE MISSION A TRAITOR CAN SIT INSIDE. Undermining here
// is not sabotage of a machine, it is TAKING while telling everybody you will
// hold — which is an ordinary human failure of nerve as well as a strategy, and
// the record cannot tell those apart because from the other side of the screen
// nobody can. The mission stores WHO SAID WHAT and WHO DID WHAT, and the gap
// between the two columns is the whole afternoon. A Faithful whose nerve goes
// leaves exactly the same gap.
//
// AND STILL NOT GUARANTEED. A conflicted player's take is a shift to a
// probability that their own loyalty and temperament push back on, and the
// team can carry two defectors if enough of the rest hold. Nothing here makes a
// betrayal certain and nothing here makes it free.
//
// THE THREE PHASES USE STRATEGIC AND MENTAL (the survey), SOCIAL AND BOLDNESS
// (the room), and TEMPERAMENT AND LOYALTY (the settlement) — a different pair
// each time, none of them the pairs the other three missions use for their
// heavy phases, so the counting room is won by people the sandbar had no use
// for.

import {
  briefingText, clamp01, confessionalVoice, freshPick, hostDo, hostSay, PHASE_SWING,
  missionQuality, missionScene, noisyPair, payPot, placementsFrom,
  pronounSlots, render, splitTeams, statOf, validateMissionRecord, weightedPick,
} from './contract.js';

const TEAMS = ['Ink', 'Wax'];

/** How many debts are in the book. Enough for everybody to argue one. */
const debtsFor = n => Math.max(4, Math.min(12, n));

// ══════════════════════════════════════════════════════════════════════
// THE BRIEFING
// ══════════════════════════════════════════════════════════════════════

function _ceremony(debts) {
  const hostBeats = [
    hostDo('The counting room. Two long tables facing each other across a green baize '
      + 'floor, a locked strongbox on a stand between them, and a clerk with a ledger.'),
    hostSay('The man who owned this house died owing money to a great many people, and '
      + 'the estate has sent somebody to settle it. That is the gentleman with the box. '
      + 'He is not on your side and he is not on mine.'),
    hostDo('The host lifts the oilcloth off the debt book and lets it fall open.'),
    hostSay(`In this book are ${debts} claims against the estate. Some of them are real. `
      + 'Some of them were invented by people who thought nobody would ever check. You '
      + 'have twenty minutes with the book to decide which is which.'),
    hostSay('Then you bring your claims to that table, one player at a time, and you argue '
      + 'them. He will test you. If you press a claim you cannot support, he will strike '
      + 'it out and you will not get another turn.'),
    hostDo('The host walks to the middle of the room and stands beside two writing screens.'),
    hostSay('And then the part that decides the afternoon. He will make every one of you a '
      + 'single offer, at once, and you will answer behind these screens where nobody '
      + 'can see you. You may HOLD your price, or you may TAKE what he offers.'),
    hostSay('A take is safe and it is small. A hold is worth four times as much — and a '
      + 'hold only pays if enough of your side holds with you. If too many of you take, '
      + 'the people who held get nothing, and the people who took keep theirs.'),
    hostDo('The host looks along both tables without hurrying.'),
    hostSay('You may say anything you like to each other before you go behind that screen. '
      + 'Nobody will ever be shown what you actually wrote. I want to be very clear '
      + 'about that: nobody, including me, including tonight.'),
    hostSay('Every claim settled goes into the pot you are all playing for. Whatever is '
      + 'still in that box when the clerk closes the book stays with the estate. Read '
      + 'your book.'),
  ];
  return {
    ceremonyId: 'mission-brief-long-account',
    staging: 'A panelled counting room with two long tables on green baize, a locked '
      + 'strongbox on a stand between them, a clerk, a debt book on a lectern, and two '
      + 'writing screens set up in the middle of the floor.',
    hostBeats,
    contestantBeats: [],
    rulePoints: [
      { id: 'task', explainedByBeat: 3 },
      { id: 'failure', explainedByBeat: 4 },
      { id: 'settlement', explainedByBeat: 6 },
      { id: 'reward', explainedByBeat: 7 },
      { id: 'secrecy', explainedByBeat: 9 },
      { id: 'finish', explainedByBeat: 10 },
    ],
    revealBeats: hostBeats.length,
    reminder: 'The host reminds the room that a struck claim cannot be argued twice, and '
      + 'that a hold only pays if enough of the team holds with it.',
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 1 — THE SURVEY. strategic and mental, over a book of lies.
// ══════════════════════════════════════════════════════════════════════
const SURVEY_GOOD = [
  '{who} found three claims signed in the same hand on three different dates and set all three aside.',
  '{who} worked out that the estate had already paid one of them and put it straight in the discard.',
  '{who} did not read the book front to back. {They} read the totals, which is why {they} finished first.',
  '{who} spotted that the biggest claim in the book was for a delivery made after the man had died.',
];
const SURVEY_BAD = [
  '{who} picked the largest number on the page and never asked why it was the largest number on the page.',
  '{who} spent the whole survey on the two claims that were obviously real and never looked at the rest.',
  '{who} was persuaded to back a claim by the fact that it was written very neatly.',
  '{who} read the book carefully and came out of it with a list that was mostly the invented ones.',
];
const SURVEY_ARGUE = [
  '{who} wanted the big claim. {other} wanted the four small ones. The book got read twice while they settled it.',
  '{other} said the big claim was a trap. {who} said {other} was frightened of the money.',
  '{who} and {other} split the book between them and came back with two lists that did not overlap at all.',
];

function _survey(ctx, rng, teams, debts) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  const claims = {};
  for (const t of teams) {
    let good = 0;
    for (const name of t.members) {
      const v = noisyPair(rng, name, 'strategic', 'mental');
      contrib[name] = clamp01(v / 10) * 10;
      const slots = pronounSlots(name);
      const sound = rng() < clamp01(0.12 + 0.072 * v);
      if (sound) good += 1;
      if (v >= 7.3 && sound) {
        beats.push({ team: t.name, player: name, kind: 'good', score: v,
          text: render(freshPick(rng, SURVEY_GOOD), slots) });
      } else if (v <= 3.7 || !sound) {
        contrib[name] = Math.max(0, contrib[name] - 1);
        beats.push({ team: t.name, player: name, kind: 'bad', score: v,
          text: render(freshPick(rng, SURVEY_BAD), slots) });
      } else {
        beats.push({ team: t.name, player: name, kind: 'steady', score: v,
          text: `${name} came out of the book with one claim ${slots.they} could defend and `
            + 'no illusions about the rest.' });
      }
    }
    claims[t.name] = good;

    if (t.members.length >= 2) {
      const ranked = [...t.members].sort((a, b) => contrib[b] - contrib[a]);
      const who = ranked[0];
      const other = ranked[1];
      const slots = { ...pronounSlots(who), other };
      scenes.push(missionScene({
        id: `account-survey-argue-${t.name}`,
        eventId: 'account-book-split-two-ways',
        phase: 'survey',
        participants: [who, other],
        behaviour: contrib[who] - contrib[other] > 3 ? 'impressive' : 'suspicious',
        text: render(freshPick(rng, SURVEY_ARGUE), slots)
          + ` ${t.name} took ${good} defensible claims to the table.`,
        effects: [
          { kind: 'bond', players: [who, other], delta: -0.3,
            source: `${who} and ${other} disagreed about which claims ${t.name} should press` },
          { kind: 'claim', claimant: other, about: who,
            text: `${other} says ${who} chose the claims without hearing anybody else`,
            source: `${who} and ${other} came out of the debt book with lists that did not overlap` },
        ],
        confessional: {
          purpose: 'hidden-intent', speaker: who,
          text: confessionalVoice(who, {
            villainous: "You don't win a room like that with the biggest claim. You win it with "
              + "the one they've already half admitted. I'm not explaining that to anybody twice.",
            nice: `I picked the claims I was fairly sure I could stand up. I didn't mean to run `
              + `${other} over doing it — I just didn't have time to take a vote on every line in the book.`,
            neutral: `Everybody came out of that book with a list. Mine was shorter and it was `
              + `better. I'm not relitigating it with ${other} — the ledger said what it said.`,
          }),
        },
      }));
    }
  }

  const score = t => t.members.reduce((s, n) => s + contrib[n], 0) / Math.max(1, t.members.length);
  return {
    phase: {
      id: 'survey', name: 'The Survey',
      setting: 'A lectern with the estate\'s debt book open on it, and twenty minutes.',
      stats: ['strategic', 'mental'],
      beats,
      claims: { ...claims },
      teams: teams.map(t => ({ name: t.name, score: clamp01(score(t) / 10), claims: claims[t.name] })),
    },
    contrib, scenes, claims,
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 2 — THE ROOM. social and boldness, one player at a time.
// ══════════════════════════════════════════════════════════════════════
//
// Everybody gets a turn across the table from the agent. The claim they are
// arguing is only as good as the survey made it — the chain again — but the
// room can rescue a weak claim and lose a strong one, which is what makes this
// a different phase rather than the survey scored twice.
const ROOM_WIN = [
  '{who} sat down, put one page on the table, and did not say anything else until he had read it.',
  '{who} let him talk himself into a position and then asked, pleasantly, whether he would like to write that down.',
  '{who} argued a claim {they} did not entirely believe in, and was believed.',
  '{who} conceded the small half of the claim immediately, which made the large half impossible to refuse.',
];
const ROOM_LOSE = [
  '{who} pressed a claim {they} could not support and had it struck out in front of everybody.',
  'He asked {who} one question about the date and there was no answer to it.',
  '{who} got loud about it, which is the one thing that does not work on a man with a ledger.',
  '{who} had the right claim and the wrong hour, and came away from the table with nothing.',
];
const ROOM_STEP_IN = [
  '{who} was up next and gave {their} turn to {other}, who had a better claim and was not going to ask for it.',
  'When {other}\'s claim was struck, {who} took the same page back to the table and argued it again from the other end.',
  '{who} stood behind {other}\'s chair for the whole turn, which is not allowed and was not stopped.',
];
const ROOM_NEVER_SAT = [
  '{who} had a claim in {their} hand and never took it to the table. It was still in {their} hand when the clerk closed the book.',
  '{who} let {their} turn go by. Twice. Nobody made {them} explain it and nobody had to.',
  'Every time it was {who}\'s turn, {who} was somewhere else in the room, doing something that needed doing.',
  '{who} got as far as the chair, looked at the man behind the ledger, and said somebody else should go first.',
];
const ROOM_WATCH = [
  '{who} watched {other} lose a claim and said nothing at the time, and quite a lot afterwards.',
  '{who} had told {other} not to press that one. {who} made sure the table knew {they} had said so.',
];

function _room(ctx, rng, teams, claims) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  const settled = {};
  for (const t of teams) t.members.forEach(n => { contrib[n] = 0; });

  for (const t of teams) {
    const carry = clamp01(claims[t.name] / Math.max(1, t.members.length));
    let won = 0;
    const losers = [];
    for (const name of t.members) {
      const v = noisyPair(rng, name, 'social', 'boldness');
      contrib[name] = clamp01(v / 10) * 10;
      const slots = pronounSlots(name);
      const pWin = clamp01(0.08 + 0.058 * v + 0.28 * carry);
      if (rng() < pWin) {
        won += 1;
        contrib[name] += 1.2;
        beats.push({ team: t.name, player: name, kind: 'win', score: v,
          text: render(freshPick(rng, ROOM_WIN), slots) });
      } else {
        losers.push(name);
        contrib[name] = Math.max(0, contrib[name] - 1.2);
        beats.push({ team: t.name, player: name, kind: 'lose', score: v,
          text: render(freshPick(rng, ROOM_LOSE), slots) });
      }
    }
    settled[t.name] = won;

    // AND SOMEBODY DID NOT SIT DOWN AT ALL, which is the afternoon's cowardice
    // and is a different failure from losing a claim. Proportional in boldness
    // — a bold player can still bottle it and a timid one can still go — and
    // it costs the team a turn, so it is not free colour.
    const shy = weightedPick(rng, t.members, n => 0.2 + (10 - statOf(n, 'boldness')) / 6);
    if (rng() < clamp01(0.08 + 0.042 * (10 - statOf(shy, 'boldness')))) {
      contrib[shy] = Math.max(0, contrib[shy] - 1.8);
      scenes.push(missionScene({
        id: `account-room-never-sat-${t.name}`,
        eventId: 'account-turn-not-taken',
        phase: 'room',
        participants: [shy],
        behaviour: 'cowardly',
        text: render(freshPick(rng, ROOM_NEVER_SAT), pronounSlots(shy))
          + ` That is a turn ${t.name} did not get back.`,
        effects: [
          { kind: 'record', player: shy, field: 'turnNotTaken', value: true,
            source: `${shy} never took a claim to the agent's table` },
          { kind: 'crowd', name: shy, colour: 'cowardly', mult: 0.7,
            source: `${shy} let ${t.name}'s turn at the table go by` },
        ],
        confessional: {
          purpose: 'emotional-turn', speaker: shy,
          text: confessionalVoice(shy, {
            nice: "I'd read it four times. I knew the dates, I knew the signature, I knew what "
              + "I was going to say. I just couldn't make myself sit in that chair.",
            villainous: "Let them think I bottled it. I was reading the agent, not the claim — "
              + "he was in a mood to strike, and I wasn't going to hand him my name to cross out. "
              + "Not sitting down was the play.",
            neutral: "I knew the dates, the signature, all of it. I just didn't fancy being the "
              + "one in the chair while the agent was swinging. Everyone can call that whatever they like.",
          }),
        },
      }));
    }

    // Somebody either stepped in for a teammate or watched them go down. Both
    // branches cite the SAME recorded fact — a struck claim — which is the
    // mission-blame rule: the scene may only be about a phase result that
    // actually happened.
    if (losers.length && t.members.length > losers.length) {
      const other = losers[0];
      const pool = t.members.filter(n => n !== other);
      const who = weightedPick(rng, pool, n => 0.3 + statOf(n, 'loyalty') / 7);
      const stepped = rng() < clamp01(0.15 + 0.055 * statOf(who, 'loyalty')
        + 0.03 * statOf(who, 'social'));
      const slots = { ...pronounSlots(who), other };
      if (stepped) {
        won += 1;
        settled[t.name] = won;
        contrib[who] += 1.4;
        scenes.push(missionScene({
          id: `account-room-stepin-${t.name}`,
          eventId: 'account-claim-taken-back-to-the-table',
          phase: 'room',
          participants: [who, other],
          behaviour: 'heroic',
          text: render(freshPick(rng, ROOM_STEP_IN), slots)
            + ` ${other}'s claim had been struck; it was not struck the second time.`,
          effects: [
            { kind: 'bond', players: [who, other], delta: 0.8,
              source: `${who} took ${other}'s struck claim back to the table and won it` },
            { kind: 'crowd', name: who, colour: 'heroic', mult: 0.9,
              source: `${who} argued a teammate's lost claim a second time` },
          ],
          confessional: {
            purpose: 'emotional-turn', speaker: other,
            text: confessionalVoice(other, {
              nice: "I sat down having lost the room the money and I couldn't look at anybody. "
                + `And then ${who} just picked the page up like it was nothing.`,
              villainous: `I lost the room and ${who} strolled in and won it back. Generous. And `
                + `now I know ${who}'ll burn capital to be seen as the hero — which tells me exactly `
                + 'how to use them when it counts.',
              neutral: `I bombed and sat down, and ${who} took the page and won it. Good for them. `
                + "I'm not going to pretend it didn't sting to need bailing out.",
            }),
          },
        }));
      } else {
        scenes.push(missionScene({
          id: `account-room-watch-${t.name}`,
          eventId: 'account-claim-struck-in-public',
          phase: 'room',
          participants: [who, other],
          behaviour: 'selfish',
          text: render(freshPick(rng, ROOM_WATCH), slots)
            + ` ${other}'s claim was struck out and stayed struck out.`,
          effects: [
            { kind: 'bond', players: [who, other], delta: -0.6,
              source: `${who} let ${other}'s claim be struck and said so afterwards` },
            { kind: 'claim', claimant: who, about: other,
              text: `${who} says ${other} pressed a claim ${other} had been warned about`,
              source: `${other} had a claim struck out at the agent's table` },
            { kind: 'suspicion', observer: who, subject: other, delta: 0.2,
              source: `${other} argued a claim the survey had already flagged as invented` },
          ],
          confessional: {
            purpose: 'vote-change', speaker: who,
            text: confessionalVoice(who, {
              neutral: `I told ${other} that one was rotten. Sitting down and pressing it anyway's `
                + "either not listening or not caring, and I'd like to know which.",
              villainous: `I warned ${other} that claim wouldn't hold and they walked it up anyway. `
                + "That's not mine to carry — but it's a very handy thing to remind the room of, "
                + 'right before a vote.',
              nice: `I did tell ${other} that one wouldn't stand. I'm not glad I was right. `
                + "Watching it get struck was worse than losing my own would've been, honestly.",
            }),
          },
        }));
      }
    }
  }

  const score = t => t.members.reduce((s, n) => s + contrib[n], 0) / Math.max(1, t.members.length);
  return {
    phase: {
      id: 'room', name: 'The Room',
      setting: 'A long table, an estate agent with a ledger and a locked box, and one chair '
        + 'on the wrong side of it.',
      stats: ['social', 'boldness'],
      beats,
      settled: { ...settled },
      teams: teams.map(t => ({ name: t.name, score: clamp01(score(t) / 10), settled: settled[t.name] })),
    },
    contrib, scenes, settled,
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 3 — THE SETTLEMENT. temperament and loyalty, behind a screen.
// ══════════════════════════════════════════════════════════════════════
//
// The one phase in any of the four missions where the players choose rather
// than perform. Everybody says something out loud first, then everybody writes
// HOLD or TAKE where nobody can see.
//
// THE PAYOFF, AND WHY IT IS SHAPED LIKE THIS. A take is worth a quarter of a
// hold, and a hold pays only if strictly more than half the team held. So:
//
//   * everybody holds  -> the best afternoon available, by a distance;
//   * one defector     -> usually survivable, and expensive for nobody but
//                         the person who has to explain it;
//   * enough defectors -> the holders get NOTHING and the takers keep theirs,
//                         which is the shape that makes it a real decision
//                         rather than a coin flip with extra steps.
//
// The stored gap between `said` and `did` is the whole strategic content, and
// it is stored per player because the argument on the road home has to be able
// to name somebody. NOBODY IS TOLD THE COLUMN. The host says so in the
// briefing, and it is true of the record: `revealed` is false on every ballot,
// so a castle event that wants to accuse somebody of taking has to have
// witnessed a slip or heard a claim, not read this array.
const SAY_HOLD = [
  '"I am holding. If we all hold we walk out of here with four times the money and I would like the money."',
  '"Hold. It is not complicated. It is only complicated if somebody in here is planning to be clever."',
  '"I will hold, and I am saying it out loud so that whoever does not hold has to sit with that."',
  '"Holding. I would rather lose it as a group than take a quarter of it on my own."',
];
const SAY_HEDGE = [
  '"I will do whatever the room does." — which is a sentence that means nothing behind a screen.',
  '"We should probably hold." The word probably was audible to everybody in the room.',
  '"Look, I am not going to pretend I have decided."',
  '"Whatever we agree, I am in." {who} did not say what {they} thought the agreement was.',
];
const DID_HOLD = [
  '{who} held.',
  '{who} wrote HOLD without appearing to think about it.',
  '{who} held, and came out from behind the screen looking for somebody\'s face.',
];
const DID_TAKE = [
  '{who} took.',
  '{who} wrote TAKE, folded it, and was the first one back at the table.',
  "{who} took it, folded the card twice, and put it in the clerk's tray face down.",
];
const HOLD_PAID = [
  'The clerk counted the screens, and the holds had it. Every one of them is paid in full.',
  'More than half of {team} held, which is all it needed. The agent looked genuinely annoyed.',
  '{team} held together and the box came open properly for the first time all afternoon.',
];
const HOLD_BROKE = [
  'The clerk counted the screens. {team} did not have the holds, and everybody who held is paid nothing.',
  'It went by two. The people who took keep what they took; the people who trusted them keep the walk home.',
  '{team} came apart behind the screens, quietly, in about eleven seconds.',
];

function _settlement(ctx, rng, teams, settled) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  const ballots = {};
  const outcome = {};

  for (const t of teams) {
    const rows = [];
    for (const name of t.members) {
      const v = noisyPair(rng, name, 'temperament', 'loyalty');
      // WHAT THEY SAID. Proportional in loyalty and social; a hedge is not a
      // lie and the record does not call it one.
      const saidHold = rng() < clamp01(0.30 + 0.05 * statOf(name, 'loyalty')
        + 0.02 * statOf(name, 'social'));
      // WHAT THEY DID. The nudge for somebody with a reason to want the room
      // poorer is 0.13 — against a base that a loyal, steady player already
      // beats by more than that. A cast of nine-loyalty Faithfuls holds; a
      // cast of frightened ones does not; and a conflicted player with high
      // loyalty holds more often than a Faithful with low loyalty, which is
      // the point.
      const pHold = clamp01(0.16 + 0.048 * v + (saidHold ? 0.16 : -0.06)
        - (ctx.conflicted(name) ? 0.13 : 0));
      const held = rng() < pHold;
      contrib[name] = clamp01(v / 10) * 10;
      rows.push({ name, saidHold, held, score: v });
      const slots = pronounSlots(name);
      beats.push({ team: t.name, player: name, kind: held ? 'held' : 'took', score: v,
        said: render(freshPick(rng, saidHold ? SAY_HOLD : SAY_HEDGE, 3), slots),
        text: render(freshPick(rng, held ? DID_HOLD : DID_TAKE, 2), slots) });
    }

    const holds = rows.filter(r => r.held).length;
    const paid = holds * 2 > rows.length;
    outcome[t.name] = { holds, takes: rows.length - holds, paid };
    ballots[t.name] = rows.map(r => ({
      // `revealed: false` is not decoration. It is the record saying, in a
      // field a castle event can actually read, that nobody in the castle is
      // entitled to this column — the host promised it in the briefing and a
      // scene that accuses somebody of taking must get there another way.
      player: r.name, saidHold: r.saidHold, held: r.held, revealed: false,
    }));

    for (const r of rows) {
      // WIDER IN BOTH DIRECTIONS than the first calibration (+3.2 / -1.6),
      // because at that width no afternoon in 400 ever reached the `failed`
      // tier and four authored summary lines were unreachable. A settlement
      // that collapses should be able to sink the day; that is the whole
      // reason the phase is a decision rather than a check.
      if (r.held) contrib[r.name] += paid ? 3.6 : -3.0;
      else contrib[r.name] += 1.0;
      contrib[r.name] = clamp01(contrib[r.name] / 12) * 12;
    }

    // The public result. This one IS public — the clerk counts the screens in
    // front of everybody — so the room legitimately knows the COUNT and still
    // does not know the names, which is the exact information state the
    // afternoon is designed to produce.
    const first = rows[0].name;
    scenes.push(missionScene({
      id: `account-settlement-count-${t.name}`,
      eventId: paid ? 'account-holds-carried' : 'account-holds-collapsed',
      phase: 'settlement',
      participants: t.members,
      behaviour: paid ? 'impressive' : 'suspicious',
      text: render(freshPick(rng, paid ? HOLD_PAID : HOLD_BROKE), { team: t.name })
        + ` The clerk read out ${holds} holds and ${rows.length - holds} takes, and no names.`,
      effects: [
        { kind: 'record', team: t.name, field: 'settlementCount',
          value: { holds, takes: rows.length - holds, paid },
          source: `the clerk counted ${holds} holds and ${rows.length - holds} takes for ${t.name}` },
        { kind: 'crowd', name: first, colour: paid ? 'impressive' : 'selfish', mult: 0.3,
          source: `${t.name}'s settlement ${paid ? 'carried' : 'collapsed'} behind the screens` },
      ],
      confessional: paid ? null : {
        purpose: 'traitor-reasoning', speaker: null,
        text: "Somebody in this room stood there and said the word hold to my face. "
          + "I'd very much like to know who that was.",
      },
    }));

    // AND THE ONE PERSON WHO SAID HOLD AND DID NOT, when there is one. The
    // scene does NOT name them to the castle — it is filed as an audience-only
    // record with `visibility: 'audience'` on the effect, because the column is
    // sealed. What it gives the room is the shape of a suspicion with nothing
    // in it, which is what the castle actually has.
    const liar = rows.find(r => r.saidHold && !r.held);
    if (liar) {
      const slots = pronounSlots(liar.name);
      scenes.push(missionScene({
        id: `account-settlement-gap-${t.name}`,
        eventId: 'account-said-hold-took',
        phase: 'settlement',
        participants: [liar.name],
        behaviour: 'selfish',
        text: `${liar.name} said hold, out loud, to the table. `
          + render(freshPick(rng, DID_TAKE, 2), slots)
          + ' The screens are collected face down and the clerk does not read out names.',
        effects: [
          { kind: 'record', player: liar.name, field: 'saidHoldTook', value: true,
            visibility: 'audience',
            source: `${liar.name} told the table they would hold and wrote TAKE` },
          { kind: 'crowd', name: liar.name, colour: 'selfish', mult: 0.8,
            source: `${liar.name} said hold at the table and took behind the screen` },
        ],
        confessional: {
          purpose: 'audience-lie', speaker: liar.name,
          text: confessionalVoice(liar.name, {
            neutral: "I meant it when I said it. I meant it right up until I'm standing behind a "
              + "piece of card with a pencil, on my own, and there's nobody watching.",
            villainous: "I said hold because that's what buys you the room. I wrote take because "
              + "that's what buys you the money. Both are true — and only one of them's on the "
              + "card nobody gets to read.",
            nice: "I said hold and I meant it, and then I didn't do it, and I've felt sick about "
              + "it ever since. Nobody in there knows it was me. I know it was me.",
          }),
        },
      }));
    }
  }

  const score = t => t.members.reduce((s, n) => s + contrib[n], 0) / Math.max(1, t.members.length);
  return {
    phase: {
      id: 'settlement', name: 'The Settlement',
      setting: 'Two writing screens on the baize, a pencil each, and one word to write.',
      stats: ['temperament', 'loyalty'],
      beats,
      ballots,
      outcome,
      teams: teams.map(t => ({ name: t.name, score: clamp01(score(t) / 12),
        holds: outcome[t.name].holds, paid: outcome[t.name].paid })),
    },
    contrib, scenes, outcome,
  };
}

const SUMMARY = {
  triumph: [
    'Both sides held, both sides were paid in full, and the man with the box left considerably lighter than he arrived.',
    'Every defensible claim in the book was argued and settled, and nobody blinked behind a screen.',
    'It was a masterclass in being trusted on purpose. The estate paid four times what it meant to.',
  ],
  solid: [
    'One side held and one side did not, and the difference is sitting in the pot where everybody can see it.',
    'Enough claims went through to be worth the afternoon, and enough went the other way to be worth arguing about.',
    'A decent settlement, spoiled slightly by a screen count that nobody is going to stop thinking about.',
  ],
  scraped: [
    'One claim, argued twice, settled late, by a room that had stopped believing each other before the screens went up.',
    'The book had money in it and the counting room did not get most of it out.',
    'Almost everything was struck, and what survived survived because one person would not sit down.',
  ],
  failed: [
    'Nothing settled. Both sides came apart behind the screens and the estate kept every penny it owed.',
    'The agent closed his ledger early, which the clerk said he had never seen him do.',
    'Not one claim carried. The box went back to the estate with the seal unbroken.',
  ],
};

// ══════════════════════════════════════════════════════════════════════

export const longAccount = {
  id: 'long-account',
  name: 'The Long Account',
  teams: TEAMS,
  desc: 'The estate\'s counting room holds a debt book, a locked strongbox and an agent '
    + 'sent to settle what the last owner owed. Each team spends twenty minutes with the '
    + 'book deciding which claims against the estate are real and which were invented, then '
    + 'sends players one at a time to argue their chosen claim across the table, where the '
    + 'agent tests the dates and the signatures; finally every player is made a single offer '
    + 'at once and answers behind a writing screen, holding their price or taking what is '
    + 'offered. A claim pressed without support is struck out and cannot be argued again, '
    + 'and a hold pays four times a take but only if more than half the team holds with it — '
    + 'if too many take, everyone who held is paid nothing while the takers keep theirs. '
    + 'Every claim settled goes into the shared pot, and the screens are collected face down '
    + 'so no player is ever told who held and who did not.',

  eligibility(ctx) {
    return Array.isArray(ctx?.living) && ctx.living.length >= 4;
  },

  simulate(ctx, rng) {
    const living = [...ctx.living];
    const debts = debtsFor(living.length);
    const teams = splitTeams(living, rng, TEAMS);
    const ceremony = _ceremony(debts);

    const survey = _survey(ctx, rng, teams, debts);
    const room = _room(ctx, rng, teams, survey.claims);
    const settlement = _settlement(ctx, rng, teams, room.settled);

    const phases = [survey.phase, room.phase, settlement.phase];
    const perfOf = (tname) => {
      const parts = phases.map(p => p.teams.find(x => x.name === tname).score);
      return clamp01(parts.reduce((a, b) => a + b, 0) / parts.length + (rng() - 0.5) * PHASE_SWING);
    };
    const scored = teams.map(t => ({ name: t.name, members: [...t.members], perf: perfOf(t.name) }));

    const playerScores = {};
    for (const n of living) {
      playerScores[n] = Number(((survey.contrib[n] || 0) + (room.contrib[n] || 0)
        + (settlement.contrib[n] || 0)).toFixed(3));
    }

    const quality = missionQuality(scored[0].perf, scored[1].perf);
    const pay = payPot(quality);

    const rec = {
      id: 'long-account', ep: ctx.ep, name: 'The Long Account',
      ceremony, briefing: briefingText(ceremony.hostBeats),
      teams: scored,
      phases,
      playerScores,
      placements: placementsFrom(playerScores),
      quality, tier: pay.tier,
      bestTeam: scored[0].perf >= scored[1].perf ? scored[0].name : scored[1].name,
      potBefore: pay.potBefore, gross: pay.gross, potEarned: pay.potEarned,
      potAfter: pay.potAfter, earned: pay.potEarned,
      shields: [],
      sideObjectives: [],
      scenes: [...survey.scenes, ...room.scenes, ...settlement.scenes],
      summary: freshPick(rng, SUMMARY[pay.tier]),
      tally: { debts, claims: { ...survey.claims }, settled: { ...room.settled },
        settlement: { ...settlement.outcome } },
    };
    return validateMissionRecord(rec, ctx);
  },
};

export default longAccount;
