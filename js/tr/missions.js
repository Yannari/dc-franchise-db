// ══════════════════════════════════════════════════════════════════════
// tr/missions.js — the money, and why grinding for it may be a mistake
// ══════════════════════════════════════════════════════════════════════
//
// Spec 7.2. A mission pays into a SHARED POT and grants nothing else. Not
// immunity, not safety at the table, not a read on anybody. That restraint is
// the whole design: the pot is collected by whoever is still standing at the
// end, so a Faithful who hauls coffins up a cliff every afternoon for three
// weeks may be doing unpaid labour for the two people quietly murdering their
// friends. The sting is STRUCTURAL — it does not need a mechanic, it needs the
// pot to be worth having and the Traitors to be able to walk off with it.
//
// WHICH MEANS GENEROSITY IS A BUG. The pot has a ceiling and seasons are
// EXPECTED to fail to reach it. If a cast routinely maxes the pot then the
// missions stop being a gamble on other people's honesty and become a
// formality with a fixed payout, and the sting goes with it. Every constant
// below was set by measuring the distribution over 400 seasons, not by taste;
// the numbers are in task-1-report.md. If a later change moves the mean much
// above ~two thirds of the ceiling, or makes maxing common, the change is
// wrong even if every test is green.
//
// WHAT A MISSION DOES NOT DO, IN THIS TASK, AND IT IS NOT AN OMISSION:
//
//   * It writes NO beliefs, and it still does not — not one `learn()` call
//     originates in this file. ONE archetype (`blind-chess`, below) now
//     produces the OBSERVABLE that evidence source 4 reads: a record of who
//     played their board unlike themselves. Turning that record into a belief
//     is `missionEvidence()` in js/tr/deduction.js, which is where every other
//     evidence source in the game already lives, and it emits `deduced` or
//     `rumor` and nothing above. The Seer is the game's single `observed`
//     alignment write and it is not this file's business.
//
//     THE RULE IS THE CREDIBILITY, NOT THE CALL. Keeping the emission in
//     deduction.js is a layering choice, not the guard: a mission that wrote
//     `deduced` beliefs directly would break no rule of this format. What may
//     never happen — from here or from there — is an alignment belief above
//     `deduced`, because the three `public` writers (the turret, the reveal,
//     a recruit shown the turret) and the Seer's single `observed` are a
//     CLOSED SET and `knowsAlignmentOf()` discriminates on exactly that.
//   * It writes NO bonds and touches NO player state. A mission's entire
//     footprint on a season is `gs.tr.pot`, `gs.tr.missions` and — for the
//     one knowledge archetype — the beliefs deduction.js forms off its
//     record. That is asserted directly in tests/tr-missions.test.js by
//     playing every season twice with the FIVE MONEY MISSIONS ONLY, missions
//     on and missions off, and demanding a bit-identical log of who was
//     banished and who died.
//
//     THAT ARM WAS NARROWED FOR THIS TASK AND THE NARROWING IS THE POINT.
//     Task 1 could assert "a mission grants nothing at all", which is the
//     strongest possible form of "a mission cannot grant immunity". It is no
//     longer true, because `blind-chess` is SUPPOSED to move a season: it
//     feeds the deduction engine. What survives is the same rule with the one
//     sanctioned channel held out — the money missions still buy nothing, and
//     the Chess mission buys knowledge and only knowledge. A bond write, a
//     shield, a nudge to a ballot from any of the six would still show up.
//
//     Bonds specifically remain forbidden, and not out of tidiness: a bond
//     feeds `bondResistance()` -> `suspicion()`, so a mission writing bonds
//     would move the deduction bands from a content edit and there would be
//     no way to tell that from an engine change.
//   * It never consumes the game's own rng. Missions are handed their own
//     hashed stream by headless.js (`_missionRngFor`) for the same reason the
//     castle layer has one — a draw taken here would re-roll every murder,
//     ballot and banishment after it, and the calibration bands would move on
//     a content edit rather than on an engine change.
import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
// THE ONE THING IN THIS FILE THAT READS GROUND TRUTH, and the header note used
// to say nothing here may. It says so no longer, deliberately: spec 4.4's
// fourth evidence source is "a Traitor who knows the answer and must not show
// it", and there is no way to model a dilemma only a Traitor has without
// asking who the Traitors are. That is legitimate here for the same reason it
// is legitimate in `chooseBanishmentVote` and forbidden in a castle event: the
// engine may know; the CASTLE may not, and nothing in js/tr/castle/ imports
// this file. What the room gets out of it is a BEHAVIOURAL record — how
// somebody played, against how they were expected to — with no alignment in it
// anywhere. Read the shape of `tells` below: it carries a deviation and a
// direction, and never a role.
import { alignmentAt } from './roles.js';
// THE POWER LAYER. The Shield's block mechanic lives in js/tr/murder.js and
// its visibility model in js/tr/powers.js; this file owns only the AFTERNOON
// the Shield is won on — who broke away from the carry, whether they found
// anything, and what it cost the castle in money. Nothing about who saw it,
// how long it lasts or what anybody concludes from it is decided here.
import { awardShield, awardDagger, daggerAfternoon } from './powers.js';
import { shieldSource } from './armoury.js';

// ══════════════════════════════════════════════════════════════════════
// THE POT ARITHMETIC LIVES IN js/tr/missions/contract.js
// ══════════════════════════════════════════════════════════════════════
//
// Every one of these constants was declared here, with the paragraph that
// justified it, until Task 8 gave the bespoke missions the SAME payout
// arithmetic — which they must have, because the pot distribution is a
// calibrated band (this file's own header, and tests/tr-missions.test.js) and
// a second payout curve would move that band from a content edit.
//
// So they moved rather than being copied. A constant written in two places is
// not a constant, and every duplicate-source drift in this project started as
// two. The values, the comments and the reasoning are unchanged and live in
// js/tr/missions/contract.js; `POT_CEILING` is re-exported from here so the
// eleven modules and tests that already import it from this file keep working.
import {
  POT_CEILING, MISSION_MAX, SIDE_BONUS, DIFFICULTY, PASS_MARK, BEST_WEIGHT,
  SWING, MIN_PLAYERS,
} from './missions/contract.js';
export { POT_CEILING };
// THE BESPOKE CATALOGUE, and the one place it plugs into the played engine.
// `runMission` chooses a bespoke afternoon first when the catalogue is enabled;
// its `simulate` writes its own pot line and record, and `applyMissionEffects`
// applies the bonds, reads, claims and crowd moments it declares. When the
// catalogue is off (its default) none of this runs and the archetype stream is
// bit-identical to before — no rng draw is taken.
import { pickBespokeMission, bespokeMission, bespokeMissionsEnabled, BESPOKE_MISSION_IDS } from './missions/index.js';
import { createMissionCtx } from './missions/contract.js';
import { applyMissionEffects } from './missions/apply.js';

// ══════════════════════════════════════════════════════════════════════
// THE CHESS MISSION — knowledge as the currency (spec 7.2, evidence source 4)
// ══════════════════════════════════════════════════════════════════════
//
// Spec 7.2 requires AT LEAST ONE archetype in which knowledge is what is being
// spent, so that spec 4.4's fourth evidence source has something to read. Its
// words for that source: "a Traitor who knows the answer and must not show it.
// Sabotage sits here."
//
// So the puzzle is about the castle itself. The board is reconstructed from
// the season's own record — who sat where, who moved when, which piece came
// off the night somebody died — and a Traitor genuinely holds more of that
// record than anybody else in the room, because they wrote part of it in the
// turret. That is not a bonus handed to them. It is a PROBLEM:
//
//   * PRESS the advantage and you finish a board you had no business
//     finishing, in front of eighteen people who thought they knew what you
//     were good at.
//   * HOLD it back and you visibly throw a game you should have won, which is
//     the sabotage the spec names — and it costs the castle money, because the
//     pot is scored off the boards.
//
// Both leave the same kind of mark: you played unlike yourself. THE ROOM
// CANNOT SEE WHICH IT WAS, and it cannot see alignment either. It sees a
// deviation from what it expected of you — and what it expected of you is a
// REPUTATION, not a stat line, which is where the false positives come from
// and why they must stay. A quiet, sharp Faithful whom nobody rated turning in
// the best board in the hall is exactly the innocent this format burns.
//
// WHO GETS TO READ IT is the part that makes knowledge the currency rather
// than decoration: only the players who solved their OWN board. You buy the
// read by playing well. Everybody else was too busy losing to notice.

/** Spread on one player's own board. +/- 7.5 points around their own level. */
const CHESS_BOARD_SWING = 0.30;

/**
 * How badly the room misjudges a person before the mission even starts.
 *
 * THE SOURCE OF EVERY FALSE POSITIVE THIS CHANNEL HAS, and it is load-bearing
 * rather than a tolerance. Score the deviation against the player's true stat
 * line and a Faithful can never deviate far enough to be read at all — the
 * channel becomes an oracle that names Traitors and only Traitors, which is
 * not a deduction engine, it is a ground-truth leak wearing a mission's hat.
 * The room's expectation is a rough public reputation, it is wrong about some
 * people by a lot, and those are the people it accuses.
 */
const CHESS_REP_NOISE = 0.26;

/** What already holding part of the answer is worth on the board. */
const CHESS_EDGE = 0.17;

/** What deliberately playing badly costs — on the board, and on the pot. */
const CHESS_HOLD = 0.22;

/** Below this deviation the room reads nothing into it. It was just a game. */
const CHESS_TELL_CUT = 0.20;

/** How far past the cut a tell has to go before it is as loud as it gets. */
const CHESS_TELL_SPAN = 0.20;

/**
 * How much of the season has to have HAPPENED before this board can be built.
 *
 * IT IS A FICTIONAL CONSTRAINT AND A CALIBRATION ONE AND THEY AGREE, which is
 * the only reason it is written as a rule rather than as a tuned number.
 *
 * The fiction: the game on the board is reconstructed from the castle's own
 * record — who sat where, who moved when, which piece came off the night
 * somebody died. On night one there is no record. On night three there is
 * barely one, and — the part that matters — a Traitor three days in knows
 * almost nothing the rest of the hall does not. The dilemma this whole
 * archetype is built on only exists once the Traitors have something to keep
 * quiet about.
 *
 * The measurement: shipped without this gate, the mission ran from night one
 * and moved EARLY lift from 3.34pp to 7.51pp over six decorrelated 200-season
 * blocks, against a pinned band of `< 0.10` with a worst block of 8.65. That
 * band exists because a format whose room is sharp on night three has no
 * season in it — the promise is that the LAST table is the sharp one. A
 * knowledge channel live from the first afternoon is information leaking in
 * early by the most direct route there is.
 *
 * Four closed rounds, so the first Chess board is round six at the earliest.
 */
const CHESS_MIN_ROUNDS = 4;

/**
 * How many places the Chess mission takes in the pool once it has unlocked.
 *
 * A NUMBER SET BY A REQUIREMENT, NOT BY TASTE. At an even one-in-six share of
 * the afternoons past the gate a season runs 0.65 Chess missions, and NEARLY
 * HALF OF ALL SEASONS CONTAIN NO EVIDENCE SOURCE 4 AT ALL. Spec 7.2 asks for
 * an archetype that makes knowledge the currency so that source exists; a
 * source absent from half the seasons is not one the format can be said to
 * have. At weight 2 in a pool of six, measured over 600 seasons: 1.01 Chess
 * missions a season, present in 73.2% of them. Still not every season — the
 * gate means a short one may never get there — but the common case rather than
 * the coin flip.
 *
 * IT IS 3 AND NOT 2 BECAUSE THE POOL GREW, AND THAT IS ARITHMETIC RATHER THAN
 * A REPRICING. Task 3 adds a seventh archetype at weight 2, which would have
 * cut this one's share from 2/7 to 2/9 and taken about a fifth of the emission
 * — and with it about a fifth of the +3.28pp below — off a band, from a task
 * that never touched the channel. At weight 3 in a pool of ten the Chess
 * mission's measured per-season rate is held where Task 2 put it. The rule
 * this encodes: an archetype added to the rotation must state what it does to
 * every other archetype's rate, because the rotation is a denominator and the
 * calibration bands are measured on the numerators.
 *
 * It is also the format's own emphasis: this is the mission whose material is
 * the season itself, so it is the one the castle comes back to as there gets
 * to be more of a season to come back to.
 *
 * WHAT IT COSTS, measured over twelve decorrelated 200-season blocks, is
 * roughly linear in the emission rate: at weight 1 the late-lift separation
 * moved +2.22pp (t = 5.50), at weight 2 it moves +3.28pp (t = 8.90), and early
 * lift is unmoved at both. Raising it further is a real design decision about
 * how much of this format's deduction should come from one archetype, not a
 * free improvement — see the price note in js/tr/deduction.js.
 */
const CHESS_WEIGHT = 3;

/**
 * How often the Shield archetype comes up, and why it is not 1.
 *
 * Weighted alongside `blind-chess` rather than sitting in the pool at an even
 * one-in-seven, for the same reason that one is: a power that appears in a
 * third of seasons is not a power the format has. At weight 2 the Reliquary
 * runs about 2.3 times a season and produces about 1.3 Shields (the searcher
 * does not always find it), which is roughly the show's own rate.
 *
 * IT ALSO HAS TO NOT DILUTE THE CHESS CHANNEL. Adding a seventh archetype
 * lowers every other archetype's share, and `blind-chess` carries the whole of
 * evidence source 4 — its rate is worth +3.28pp of late lift and would fall
 * with it. CHESS_WEIGHT was raised from 2 to 3 alongside this so that the
 * Chess mission's per-season rate is held where Task 2 measured it, which is
 * the difference between a band moving because this task changed the engine
 * and a band moving because this task changed a denominator.
 */
const SHIELD_WEIGHT = 2;

/**
 * Who walks away from the line to go looking, and it is a character question.
 *
 * Proportional in boldness and inversely proportional to loyalty, never a
 * threshold on either: leaving five people carrying your end of the work to
 * chase something for yourself is exactly the trade the archetype is about.
 * The floor is small and non-zero so that a cautious, dutiful cast still
 * produces somebody — a mission where nobody ever breaks away has no Shield in
 * it and no afternoon either.
 */
const SEARCH_FLOOR = 0.05;
const SEARCH_BOLD = 0.55;
const SEARCH_LOYAL = 0.70;

/**
 * And whether they actually find it. Intuition, because the caskets are
 * identical and the trick is noticing which one is the wrong weight.
 *
 * Deliberately short of certain at the top of the range: an afternoon spent
 * hunting is an afternoon the castle was paid nothing for, and it has to be
 * possible to spend it for nothing. Measured at ~57% over the roster.
 */
const FIND_BASE = 0.45;
const FIND_PER_POINT = 0.55;

// ══════════════════════════════════════════════════════════════════════
// THE ARCHETYPES
// ══════════════════════════════════════════════════════════════════════
//
// Five, and the rotation below refuses to run the same one twice in a row,
// because a season that runs the same mission eight times has no missions in
// it — it has one mission and a counter. Each pairs a PRIMARY stat with a
// SECONDARY one, and the five pairs between them reach seven of the nine
// stats, so the cast member who is useless on the cliff is the one reading
// the ledger. Nothing here reads alignment, and nothing here may.
const ARCHETYPES = [
  {
    id: 'coffin-dig',
    // WHAT THEY PHYSICALLY DO. Rendered on the brief card: the outcome
    // lines below say what HAPPENED, and without this the viewer is told a
    // mission name and a result with no task in between.
    task: 'Dig weighted coffins out of a tidal flat and carry them up the cliff path before the sea closes over the dig. Every box that clears the water line is paid for; anything still down there when the tide turns is lost.',
    name: 'The Sunken Coffins',
    teams: ['Ravens', 'Hounds'],
    primary: 'endurance', secondary: 'physical',
    lines: {
      triumph: [
        'Both teams had their coffins on the cart before the water reached the second marker, and the estate manager stopped counting and simply watched.',
        'The flat gave up every box it was hiding. Nobody stopped digging until there was nothing left down there to find.',
        'They worked the tide instead of racing it, and came up the cliff path with more than the count required and time to spare.',
        'It was ugly, waist-deep and entirely successful — the last coffin cleared the water line with the sea already closing behind it.',
      ],
      solid: [
        'Enough coffins came up to be worth the walk back, and enough stayed down to be worth arguing about at dinner.',
        'The tide took two of them. The rest went on the cart, and the cart went up the path, and that was the afternoon.',
        'Neither team disgraced itself. Neither team will be telling this story in ten years either.',
        'Mud to the knee, a respectable haul, and a shared understanding that it could have been a great deal better.',
      ],
      scraped: [
        'One coffin. One, hauled up the path by people too tired to pretend it was worth what it cost them.',
        'The water was over the marker before the second box was even free, and what came up came up alone.',
        'They dug in the wrong place for most of the hour and salvaged the smallest possible amount from the last ten minutes of it.',
        'A scraping, and everyone knew it while it was still happening, which is the worse way to know it.',
      ],
      failed: [
        'The sea took all of it. Two teams came back up the cliff path with wet rope and nothing else.',
        'They were still arguing about where to dig when the flat went under, and the argument was the only thing they finished.',
        'Not one box cleared the water. The cart went back to the castle empty and nobody rode on it.',
        'A total loss, and a long walk home to think about it in.',
      ],
    },
    side: [
      { id: 'deepest-box', label: 'bring up the deepest coffin alone', stat: 'physical' },
      { id: 'read-the-tide', label: 'call the tide before it turned', stat: 'intuition' },
    ],
  },
  {
    id: 'cipher-crypt',
    // WHAT THEY PHYSICALLY DO. Rendered on the brief card: the outcome
    // lines below say what HAPPENED, and without this the viewer is told a
    // mission name and a result with no task in between.
    task: 'Match each numbered tomb in the crypt to its line of scripture in the ledger the abbot left, working by candlelight. Every correct match opens a strongbox. The candles are the clock.',
    name: 'The Cipher Crypt',
    teams: ['Candles', 'Keys'],
    primary: 'mental', secondary: 'strategic',
    lines: {
      triumph: [
        'The ledger came apart in their hands — every numbered tomb matched to its line of scripture with the candles still half unburnt.',
        'Somebody spotted that the abbot counted from the altar and not from the door, and after that it was simply arithmetic.',
        'Both teams cracked it, and then cracked the part that was not meant to be crackable, which was not strictly in the rules.',
        'They read a dead man\'s filing system faster than he could have read it himself.',
      ],
      solid: [
        'Most of the tombs matched. The ones that did not were the ones with the money in, which is generally the way.',
        'Slow, methodical, and correct about two thirds of the time — enough to be paid, not enough to be pleased.',
        'The candles ran down to stubs and the ledger gave up rather more than half of what it knew.',
        'A decent night\'s work in a cold room, spoiled slightly by the last three lines nobody could make agree.',
      ],
      scraped: [
        'One line of scripture, one tomb, one small box, and four people who will not be discussing this later.',
        'They read the whole ledger and understood almost none of it until the very last candle, which bought them exactly one answer.',
        'The crypt kept nearly everything. What came out came out by accident and everybody present knew it.',
        'A single match, found late, argued over, and worth barely the walk down the steps.',
      ],
      failed: [
        'The candles went out with the ledger still shut in every way that mattered.',
        'Two teams, four hours, and not one tomb opened. The abbot has kept his secrets another season.',
        'They were confidently, elaborately wrong, and stayed wrong right up until the light ran out.',
        'Nothing. Not a line, not a box, not a single number that meant what they said it meant.',
      ],
    },
    side: [
      { id: 'abbots-hand', label: 'read the abbot\'s marginal hand', stat: 'mental' },
      { id: 'false-tomb', label: 'spot the tomb that was never a tomb', stat: 'intuition' },
    ],
  },
  {
    id: 'long-drop',
    // WHAT THEY PHYSICALLY DO. Rendered on the brief card: the outcome
    // lines below say what HAPPENED, and without this the viewer is told a
    // mission name and a result with no task in between.
    task: 'Carry strongboxes one at a time across a plank gantry rigged over a dry well eighty feet deep. Each box that reaches the far side is paid for; a crossing nobody will make is a box that stays where it is.',
    name: 'The Long Drop',
    teams: ['Ropes', 'Lanterns'],
    primary: 'boldness', secondary: 'temperament',
    lines: {
      triumph: [
        'Every plank held because every person on it moved like it would, and the strongboxes came back across the gantry one after another without a pause.',
        'Nobody looked down. Nobody needed to be talked across. It was over so quickly that the crew were still setting up when it finished.',
        'They went out over the well as though the well were a corridor, and brought back more than the crew had put out there.',
        'A crossing so calm it was almost boring, which over a dry well eighty feet deep is the highest compliment available.',
      ],
      solid: [
        'Two people froze halfway and two people talked them across, and the boxes that came back came back the slow way.',
        'The gantry creaked, somebody swore, and the strongboxes arrived — most of them, eventually.',
        'It was crossed. It was not crossed well, and the second team spent longer standing still than moving.',
        'Respectable, if you do not count the eleven minutes nobody spoke and nobody moved.',
      ],
      scraped: [
        'One box came back, carried by the only person who could still make their hands work.',
        'The gantry beat them. They got far enough to reach one strongbox and not far enough to reach a second.',
        'Most of the hour was spent on the near side of the well, being encouraged, and it bought exactly one box.',
        'A single crossing, made late, made badly, and made alone.',
      ],
      failed: [
        'Nobody got past the third plank. The strongboxes are still out there and the crew had to go and fetch them.',
        'The well won without doing anything at all — it simply sat there being deep until everyone stopped.',
        'Two teams walked out onto the gantry and two teams walked back off it with nothing in their hands.',
        'Not one box. Not one crossing. A great deal of standing very still.',
      ],
    },
    side: [
      { id: 'no-harness', label: 'cross the last span without the line', stat: 'boldness' },
      { id: 'talk-them-over', label: 'talk somebody across who had stopped', stat: 'social' },
    ],
  },
  {
    id: 'wolf-run',
    // WHAT THEY PHYSICALLY DO. Rendered on the brief card: the outcome
    // lines below say what HAPPENED, and without this the viewer is told a
    // mission name and a result with no task in between.
    task: 'Run a lit lantern through the pine woods and across the ford to the castle courtyard. The money rides on the flame: a lantern that arrives still lit pays, and one that goes out on the way pays nothing.',
    name: 'The Wolf Run',
    teams: ['Pines', 'Fords'],
    primary: 'physical', secondary: 'intuition',
    lines: {
      triumph: [
        'Both lanterns came into the courtyard still lit, which the crew had not seen happen and had not planned for.',
        'They read the wind before the river and shielded the flame going in, and the flame was still there coming out.',
        'A hard run over bad ground with the light never once in danger, and both teams arrived able to speak.',
        'The pines did not put it out, the ford did not put it out, and nothing else was ever going to.',
      ],
      solid: [
        'One lantern made it. The other went out in the pines and was relit at the cost of most of the clock.',
        'They got the light home wet, guttering and technically alight, which the rules do allow.',
        'A middling run — good on the flat, bad at the water, and honest about which was which.',
        'The flame survived the estate. The people carrying it are less certain they did.',
      ],
      scraped: [
        'The lantern came in dead and was relit on the courtyard step, which counts for a fraction and no more.',
        'They lost the light at the ford and spent the rest of the run carrying a cold lamp very carefully.',
        'Barely anything. One team gave up at the treeline and the other arrived with almost nothing burning.',
        'A long run for a small payment, and the small payment was somebody\'s stubbornness at the last hedge.',
      ],
      failed: [
        'Both lanterns went out in the water and neither came back alight. There is no partial credit for the dark.',
        'The pines took the first flame and the ford took the second, and the estate kept its money.',
        'Two cold lamps came into the courtyard, carried by people who had known for twenty minutes it was over.',
        'Nothing lit, nothing earned, and a very quiet walk up the drive.',
      ],
    },
    side: [
      { id: 'ford-first', label: 'take the ford first and alone', stat: 'boldness' },
      { id: 'shortest-line', label: 'find the line through the pines nobody else saw', stat: 'intuition' },
    ],
  },
  {
    id: 'bone-market',
    // WHAT THEY PHYSICALLY DO. Rendered on the brief card: the outcome
    // lines below say what HAPPENED, and without this the viewer is told a
    // mission name and a result with no task in between.
    task: 'Trade a bag of worthless trinkets up through nine stalls of a bone market, one deal at a time, and come back with silver. Every trade must go up in value; the stallholders are under no obligation to be reasonable.',
    name: 'The Bone Market',
    teams: ['Coins', 'Cups'],
    primary: 'social', secondary: 'strategic',
    lines: {
      triumph: [
        'They walked in with a bag of buttons and walked out with silver, and the stallholders are still working out how.',
        'Every trade went up. Not one of them should have, and the ledger at the end of the row did not lie.',
        'Somebody talked a man out of a clock for a length of ribbon, and that was only the third trade of nine.',
        'A masterclass in being liked on purpose. The market gave up more than it was carrying.',
      ],
      solid: [
        'The bag came back heavier than it went out, which is the entire point, if not a triumph of it.',
        'Two teams traded up steadily and neither pulled off the one deal that would have been talked about.',
        'Good enough. Nobody was cheated badly and nobody was cheated cleverly.',
        'A market run with no disasters and no stories, which pays and does not thrill.',
      ],
      scraped: [
        'One trade went up. The other eight went sideways or worse, and the bag came back nearly as it left.',
        'They were read early and priced accordingly for the rest of the row.',
        'A single decent deal, made by one person, against the general drift of the afternoon.',
        'Almost nothing — enough to say it was not a total loss, and not enough to say much else.',
      ],
      failed: [
        'They traded down. Every stall, every time, all the way along the row, and came back with less than they carried in.',
        'The market ate them. There is no other word for it and the crew did not offer one.',
        'Nine trades, nine mistakes, and a bag of buttons that is now a smaller bag of buttons.',
        'Nothing earned, and a lasting understanding of who in this castle can be sold anything.',
      ],
    },
    side: [
      { id: 'last-stall', label: 'close the last stall on their own', stat: 'social' },
      { id: 'undersell', label: 'hold a price nobody else would hold', stat: 'temperament' },
    ],
  },
  {
    id: 'blind-chess',
    // WHAT THEY PHYSICALLY DO. Rendered on the brief card: the outcome
    // lines below say what HAPPENED, and without this the viewer is told a
    // mission name and a result with no task in between.
    task: 'Play out a game of chess on a courtyard board with the pieces hidden from the players, calling moves from memory alone. Every piece taken cleanly is paid for.',
    name: 'The Blind Chess Game',
    teams: ['White', 'Black'],
    primary: 'mental', secondary: 'intuition',
    // THE FLAG THE WHOLE TASK HANGS ON. `knowledge: true` routes this
    // archetype through _runChess instead of _drawTeams, and it is the only
    // archetype that produces `tells`. Adding a second one is a real design
    // decision and not a copy-paste: every tell is an indictment, and this
    // channel's price was swept against a control at ONE mission archetype in
    // six. Two would roughly double the emission rate at the same price.
    knowledge: true,
    lines: {
      triumph: [
        'The hall reconstructed the whole game — every piece back on the square it left, and the finish nobody had been given played out in front of them.',
        'They read the record faster than the record was written. Both boards were resolved with the light still good.',
        'Two sides, one answer, and it was the same answer, which has not happened in this hall before.',
        'It came apart cleanly: the opening from the ledger, the middle from memory, and the end from somebody simply seeing it.',
      ],
      solid: [
        'Most of the board came back. The three or four squares nobody could agree on were, as usual, the ones that mattered.',
        'Both sides got far enough to be paid and not far enough to be pleased about it.',
        'A slow, arguing, largely correct afternoon, settled about two moves short of the finish.',
        'They rebuilt enough of the game to know how it had gone, and not enough to say how it ended.',
      ],
      scraped: [
        'One line of the record came back, and it came back late, and it came back from one person.',
        'The board stayed mostly empty. What went back on it went back on the strength of a single stubborn reading.',
        'They lost the shape of it in the opening and spent the rest of the hour failing to find it again.',
        'Almost nothing reconstructed, and the little that was is not worth the walk back up the hall.',
      ],
      failed: [
        'The board never came back at all. Two sides, four hours, and a room full of pieces in the wrong places.',
        'They argued the opening into the ground and never reached the middle of it.',
        'Not one square agreed on by both sides. The record has kept its game.',
        'A total failure of reconstruction, conducted at considerable volume.',
      ],
    },
    side: [
      { id: 'name-the-piece', label: 'name the piece that came off first', stat: 'mental' },
      { id: 'sit-it-out', label: 'call the finish from the far end of the hall', stat: 'intuition' },
    ],
  },
  {
    id: 'the-reliquary',
    // WHAT THEY PHYSICALLY DO. Rendered on the brief card: the outcome
    // lines below say what HAPPENED, and without this the viewer is told a
    // mission name and a result with no task in between.
    task: 'Carry reliquaries up the tower stair, one to a niche, until every niche is filled. Every niche filled is paid for. It is also the one afternoon where somebody can leave the line and come back carrying something the castle cannot see.',
    name: 'The Reliquary',
    teams: ['Bells', 'Bones'],
    // The last stat in the game to be used by a mission, and the right one for
    // this afternoon: the carry is a line of people handing caskets up a stair
    // for an hour, and the whole archetype is about whether you stay in it.
    primary: 'endurance', secondary: 'loyalty',
    // THE FLAG THE TASK HANGS ON, and the counterpart of `knowledge: true`
    // above. It routes the archetype through _runReliquary, which is the only
    // place in this file a player leaves their team — and the only place a
    // mission produces anything a player carries out of the afternoon.
    power: 'shield',
    lines: {
      triumph: [
        'Every casket came up the stair, in order, in an hour, and the chapel was empty enough at the end to hear the ropes creak.',
        'They found the rhythm in the first ten minutes and never once broke it, which on that stair has not happened before.',
        'Two lines, one pace, and the last reliquary set down on the flags with the light still coming through the window.',
        'The vault gave up everything it had. Nobody dropped anything and nobody needed to be told twice.',
      ],
      solid: [
        'Most of the caskets came up. The three still down there are the three nobody could get a grip on.',
        'A long hour on a cold stair, honestly worked, and a haul that will not be talked about.',
        'The line held together, mostly, and the pace went with whoever was slowest, which is how a carry works.',
        'Respectable. Somebody dropped one near the top and the sound of it is the only thing anybody will remember.',
      ],
      scraped: [
        'One casket, carried up by people who had stopped speaking to each other about halfway.',
        'The line came apart early and never re-formed, and what reached the flags reached them alone.',
        'They spent most of the hour arguing about the order and the last ten minutes making up for it, badly.',
        'Barely anything came out of that chapel, and what did came out at the very end.',
      ],
      failed: [
        'Nothing came up the stair at all. Two lines, one hour, and a vault exactly as full as it started.',
        'The first casket went over on the third step and after that nobody wanted to be underneath one.',
        'They never got a line working. The reliquaries are still down there and the crew had to go and count them.',
        'A wasted afternoon in a cold room, and the castle is not a penny better off for it.',
      ],
    },
    side: [
      { id: 'the-top-step', label: 'take the top step alone with the heaviest of them', stat: 'physical' },
      { id: 'count-the-niches', label: 'work out how many were down there before anybody counted', stat: 'mental' },
    ],
  },
];

/**
 * WHAT THE SOLO TASK ACTUALLY WAS, by objective id.
 *
 * A mission record's `sideObjectives[]` carries `{ id, player, stat, achieved,
 * bonus, line }` — everything except the human phrase the id stands for, which
 * lives on the archetype's `side` spec and is baked into `line` as prose. A
 * `journey-back` castle scene arguing about the afternoon needs the phrase as a
 * BARE INFINITIVE ("take the ford first and alone") so it can be dropped into a
 * sentence the event writes itself, and the alternative — regexing it back out
 * of `line`, which has four different templates wrapped around it — is a parser
 * over prose, which this project has already replaced once (see `sceneSpeakers`
 * in js/tr/events.js).
 *
 * A pure read over the catalogue. It adds no field to the record and takes no
 * draw, so nothing about a played season moves.
 */
export const SIDE_OBJECTIVE_LABELS = Object.freeze(ARCHETYPES.reduce((out, m) => {
  for (const spec of m.side) out[spec.id] = spec.label;
  return out;
}, {}));

/** The infinitive phrase for a recorded side objective, or null if unknown. */
export function sideObjectiveLabel(id) {
  return SIDE_OBJECTIVE_LABELS[id] ?? null;
}

/** Every archetype id, for tests and for anything enumerating the catalogue. */
export const MISSION_IDS = ARCHETYPES.map(m => m.id);
// The archetypes themselves, for the guard that checks every one of them
// states its physical task (tests/tr-missions.test.js). Read-only by
// convention; nothing in the engine mutates an archetype.
export const MISSION_ARCHETYPES = ARCHETYPES;

/**
 * Test-only kill switch. The equivalence arm in tests/tr-missions.test.js
 * plays every season twice — missions on, missions off — and demands the
 * banishment and murder logs come back bit-identical. That is what proves a
 * mission grants no immunity and no advantage of any kind: with the pot the
 * only thing it touches, turning it off changes nothing about the season.
 * Nothing in the show may ever call this. Same shape as
 * `_setVoteSuspicionMult` in deduction.js and for the same reason.
 */
let _enabled = true;
export function _setMissionsEnabled(on) { _enabled = on !== false; }

/**
 * Test-only, and it is what NARROWED the equivalence arm rather than deleting
 * it (Task 1 handoff).
 *
 * Task 1 could assert the strongest possible form of "a mission grants no
 * immunity": play every season twice, missions on and off, and demand a
 * bit-identical log. `blind-chess` breaks that ON PURPOSE — it feeds the
 * deduction engine, so a season with it in plays differently, which is the
 * whole point of the archetype. The honest narrowing is not to weaken the
 * assertion to something vaguer; it is to hold the ONE sanctioned channel out
 * and re-run the same total equivalence over the other five. With this off the
 * money missions must still buy exactly nothing, and they do.
 *
 * Nothing in the show may call this. Same contract as `_setMissionsEnabled`
 * and `_setVoteSuspicionMult`.
 */
let _knowledgeMission = true;
export function _setKnowledgeMissionEnabled(on) { _knowledgeMission = on !== false; }

/**
 * Test-only, and it narrows the equivalence arm for the SECOND time — the same
 * shape as `_setKnowledgeMissionEnabled` and for the same reason (Task 1 and
 * Task 2 handoffs, both explicit about this).
 *
 * Task 1 asserted "a mission grants nothing at all". Task 2 narrowed it to "the
 * five MONEY missions grant nothing at all", holding the knowledge archetype
 * out of both arms. The Reliquary breaks it again, on purpose: it hands
 * somebody a Shield, and a Shield stops a murder, which is about as far from
 * "grants nothing" as a mission can get. The honest narrowing is not to weaken
 * the assertion — "mostly identical" has no failure state — but to hold the ONE
 * new sanctioned channel out and re-run the identical total equivalence over
 * the five money missions, which still buy exactly nothing.
 *
 * Each hold-out ships with an arm proving it holds something OUT, or a switch
 * that turned off something inert would leave the guard green and say nothing.
 *
 * Nothing in the show may call this.
 */
let _shieldMission = true;
export function _setShieldMissionEnabled(on) { _shieldMission = on !== false; }

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const pick = (rng, arr) => arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
const stat = (name, key) => {
  const v = pStats(name)?.[key];
  return typeof v === 'number' && isFinite(v) ? v : 5;
};

/** Which archetype runs, never the one that ran last. */
function _chooseArchetype(rng, ep) {
  const last = gs?.tr?.missions?.length ? gs.tr.missions[gs.tr.missions.length - 1].id : null;
  const rounds = (gs?.tr?.rounds || []).length;
  // A TICKED AFTERNOON IS A SHIELD AFTERNOON. Making the archetype merely
  // ELIGIBLE left it to the draw and it came up about 40% of the time, so a
  // ticked episode mostly did not carry a Shield — a control that does not
  // control. A pinned MISSION still wins over the tick (it is the more specific
  // instruction and it is applied before this function is even called).
  if (gs?.tr?.shieldEpisodes && gs.tr.shieldEpisodes[ep] && shieldSource() !== 'off') {
    const shieldArch = ARCHETYPES.find(a => a.power === 'shield');
    if (shieldArch) return shieldArch;
  }
  const eligible = ARCHETYPES.flatMap(m => {
    if (m.knowledge) {
      return _knowledgeMission && rounds >= CHESS_MIN_ROUNDS
        ? Array(CHESS_WEIGHT).fill(m) : [];
    }
    // No round gate on the Shield, unlike the Chess mission: a Shield needs no
    // history to make sense of, and the format hands them out from the first
    // afternoon. A Shield won on night one blocks night one's murder, which is
    // the format working rather than an edge case.
    // AND THE AUTHOR'S CHOICE OF WHERE SHIELDS COME FROM (setup: Shields).
    // 'mission' is this — the Reliquary's searcher breaks away and wins it in
    // the open. Under 'armoury' the Shield is drawn from boxes AFTER the
    // afternoon instead (js/tr/armoury.js), so the Reliquary has nothing left
    // to be about and is dropped from the pool; under 'off' there are no
    // Shields at all and it is dropped for the same reason.
    if (m.power === 'shield') {
      // A TICKED EPISODE FORCES IT. `trShieldEpisodes` (the timeline's shield
      // tickbox) says this afternoon is a Shield afternoon, so the archetype is
      // eligible whatever the season's default source is — the same "a pin is
      // an instruction" rule the Armoury follows. `off` still means off.
      const pinnedShield = !!(gs.tr?.shieldEpisodes && gs.tr.shieldEpisodes[ep]);
      const src = shieldSource();
      const wanted = src === 'mission' || (pinnedShield && src !== 'off');
      return (_shieldMission && wanted) ? Array(SHIELD_WEIGHT).fill(m) : [];
    }
    return [m];
  });
  const pool = eligible.filter(m => m.id !== last);
  return pick(rng, pool.length ? pool : eligible);
}

/** A seeded shuffle, split down the middle. Uneven casts split 1 over. */
function _splitTeams(living, rng) {
  const order = [...living];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const half = Math.ceil(order.length / 2);
  return [order.slice(0, half), order.slice(half)];
}

/** Two teams out of the living, scored on the stat pair the archetype names. */
function _drawTeams(living, m, rng) {
  return _splitTeams(living, rng).map((members, i) => ({
    name: m.teams[i],
    members,
    // Competence, then the day. The mean is deliberate: a team is only as good
    // as its average, so stacking one hero into a group of five does not carry
    // it, which is what stops the whole season being decided by one cast member.
    perf: clamp01(
      members.reduce((s, n) => s + (0.55 * stat(n, m.primary) + 0.45 * stat(n, m.secondary)) / 10, 0)
        / Math.max(1, members.length)
      + (rng() - 0.5) * SWING,
    ),
  }));
}

// ── the Chess mission's prose, kept next to the mechanic it describes ──
//
// EVERY LINE HERE IS A CLAIM ABOUT THE BOARD AND NEVER ABOUT A BELIEF. That is
// the standing requirement of this plan ("a sentence must agree with the
// ledger") honoured at source rather than asserted after the fact: whether
// anybody actually concluded anything from a tell is decided in
// `missionEvidence()` by an intuition roll this file cannot see, so no
// sentence written here is allowed to depend on it. "The room watched X throw
// a board" is true whatever the room made of it. "The room worked out X was
// lying" would be a sentence that is false most of the time it prints.
//
// The quiet line is the same discipline the other direction: it is reachable
// ONLY from the `tells.length === 0` branch, so "nothing to read" cannot print
// over something to read. Not a check — a place the contradiction cannot be
// written.
const CHESS_HELD = [
  '{who} had the ending in front of {them} and put a piece back down. The half of the hall watching noticed.',
  'Nobody could work out what {who} was doing with a board that was two moves from finished.',
  '{who} played it out slowly, badly and in the wrong direction, which for {them} took some doing.',
  'There was a stretch where {who} simply stopped, and the pieces sat there being obvious.',
];
const CHESS_PRESSED = [
  '{who} put the record back together in front of people who did not know {they} could, and could not stop once {they} had started.',
  'The finish came off {who}\'s side of the hall before anybody else had the opening straight.',
  '{who} named the square before the argument about it had properly begun, and then had to sit with having done it.',
  'Whatever {who} had walked in with, it was more than the rest of the hall had, and it showed on the board.',
];
const CHESS_QUIET = [
  'Nobody played out of character. It was two sides of a hall being ordinarily good and ordinarily bad at a hard game.',
  'For once there was nothing to read into it — every board went about the way the room would have guessed it would.',
  'A clean afternoon, in the sense that nobody gave anybody anything to talk about over dinner.',
  'The hall watched each other all the way through and came away with nothing but the game.',
];
// TWO POOLS BECAUSE A LIST OF NAMES CAN BE ONE NAME. By the last rounds the
// hall is four or five people and "above the median board" can come out as a
// single player — at which point "the ones who actually finished their side of
// it were Brick" is a sentence that got past a first draft in three of this
// project's previous plans and was caught, every time, by dumping seasons and
// reading them rather than by any assertion.
const CHESS_SOLVERS = [
  'The ones who actually finished their side of it were {who} — and the ones who finish get to look up.',
  '{who} came out of it with solved boards, which in this hall buys you the right to have been watching.',
  'It was {who} who got theirs out; everybody else was still on the opening when the light went.',
  'Only {who} were still ahead of their own boards by the end, which is the only place in the hall you can see the rest of it from.',
];
const CHESS_SOLVER_ONE = [
  'The only person who actually finished their side of it was {who} — and the one who finishes gets to look up.',
  '{who} came out of it with a solved board, which in this hall buys you the right to have been watching.',
  'It was {who} who got theirs out; everybody else was still on the opening when the light went.',
  'Only {who} was still ahead of their own board by the end, which is the only place in the hall you can see the rest of it from.',
];

/** English-list a handful of names without inventing an Oxford comma war. */
function _andList(names) {
  if (names.length <= 1) return names[0] || '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * The Chess mission. Two teams as usual, and a per-player board underneath.
 *
 * Returns `{ teams, tells, readers, boards }`. `teams[].perf` is the mean of
 * the boards rather than the stat pair, so a sandbagged board really does cost
 * the pot: the sabotage in spec 4.4 is paid for in money by the people who did
 * not do it.
 *
 * THE THREE NUMBERS THAT MAKE A TELL, in the order they matter:
 *
 *   level  — what the player is actually capable of, off mental+intuition.
 *   seen   — what the ROOM thought they were capable of. level plus a
 *            reputation error. This is the false-positive generator and it is
 *            deliberate; see CHESS_REP_NOISE.
 *   board  — what they turned in. level, plus the day's luck, plus the
 *            dilemma if they had one.
 *
 * `board - seen` is the deviation, and it is the only thing that leaves the
 * function. There is no alignment on the record.
 */
function _runChess(m, living, ep, rng) {
  const teamSplit = _splitTeams(living, rng);
  const boards = [];
  for (const name of living) {
    const level = (0.55 * stat(name, m.primary) + 0.45 * stat(name, m.secondary)) / 10;
    const seen = level + (rng() - 0.5) * CHESS_REP_NOISE;
    let board = level + (rng() - 0.5) * CHESS_BOARD_SWING;
    let dilemma = null;
    if (alignmentAt(name, ep) === 'traitor') {
      // Proportional, never a threshold: a cool strategist holds back, a bold
      // one plays it out and dares the room to make something of it.
      const pHold = clamp01(0.15 + 0.5 * (stat(name, 'strategic') / 10)
        - 0.3 * (stat(name, 'boldness') / 10));
      dilemma = rng() < pHold ? 'held' : 'pressed';
      board += dilemma === 'held' ? -CHESS_HOLD : CHESS_EDGE;
    }
    boards.push({ name, level, seen, board: clamp01(board), dilemma });
  }

  const byName = new Map(boards.map(b => [b.name, b]));
  const teams = teamSplit.map((members, i) => ({
    name: m.teams[i],
    members,
    perf: clamp01(members.reduce((a, n) => a + byName.get(n).board, 0)
      / Math.max(1, members.length)),
  }));

  const tells = [];
  for (const b of boards) {
    const dev = b.board - b.seen;
    if (Math.abs(dev) < CHESS_TELL_CUT) continue;
    const strength = clamp01((Math.abs(dev) - CHESS_TELL_CUT) / CHESS_TELL_SPAN);
    const kind = dev < 0 ? 'held' : 'pressed';
    const pr = pronouns(b.name);
    tells.push({
      player: b.name, kind, dev, strength,
      // The sentence the deduction layer will cite as its source. It says what
      // was SEEN — a board played unlike the person playing it — because that
      // is all anybody saw.
      source: kind === 'held'
        ? `threw a board ${b.name} should have won`
        : `finished a board nobody thought ${b.name} could`,
      line: _render3(_freshPick(rng, kind === 'held' ? CHESS_HELD : CHESS_PRESSED, 2),
        b.name, pr),
    });
  }

  // WHO CAN READ THE HALL: the players who solved their own board. Knowledge
  // is the currency of this mission and this is where it is spent — a read is
  // bought by playing well, not handed to whoever happens to be sharp. The cut
  // is the mission's OWN median, so a hall of experts does not all qualify and
  // a hall of amateurs still produces two or three people who saw something.
  //
  // AND ANYBODY WHO VISIBLY THREW THEIR BOARD IS OUT OF IT, however high their
  // number came in. Found by dumping seasons and reading: one mission printed
  // "nobody could work out what Bowie was doing with a board two moves from
  // finished" and then, four lines later, "Bowie came out of it with a solved
  // board". A strong player who sandbags is still above the median, so the
  // record contradicted itself — the standing requirement of this plan, in the
  // shape it keeps arriving in. Excluded HERE rather than patched in the prose,
  // because it is also the truer rule and it sharpens the dilemma the whole
  // archetype is built on: a Traitor who holds back to stay unreadable gives up
  // their own read of everybody else. Hiding costs you the afternoon's
  // information as well as the castle's money.
  const held = new Set(tells.filter(t => t.kind === 'held').map(t => t.player));
  const sorted = [...boards].sort((a, b) => b.board - a.board);
  const cut = sorted[Math.floor(sorted.length / 2)].board;
  const readers = sorted.filter(b => b.board > cut && !held.has(b.name)).map(b => b.name);

  return { teams, tells, readers, boards };
}

/**
 * The Reliquary. A carry, and one person who does not do it.
 *
 * MEASURED COST: 14.9% of the afternoon's quality, about 1,200 credits, over
 * 428 Reliquary missions — the same missions scored with the searcher's
 * contribution added back come in at 0.458 against 0.389 as played.
 *
 * Returns `{ teams, searcher, found }`. The Shield is not granted here — that
 * is `awardShield()` in js/tr/powers.js, which owns who saw it and how long it
 * lasts. What this function owns is the COST, and the cost is the point:
 *
 * THE SEARCHER CONTRIBUTES NOTHING TO THEIR TEAM, and the denominator does not
 * shrink to cover for them. A team carrying caskets a body down is a team a
 * body down, so a Shield is paid for out of the pot by everybody, including
 * the people who did not want one and the people who never knew it was found.
 * That is the structural sting spec 7.2 gives the missions, arriving one layer
 * further in: a Faithful may be funding a Traitor's prize AND paying for the
 * Shield that keeps a Traitor's target alive one more night, out of the same
 * hour of work.
 *
 * The searcher pays the hour whether or not they find anything, which is what
 * makes breaking away a gamble instead of a purchase.
 */
function _runReliquary(m, living, rng, ep) {
  const split = _splitTeams(living, rng);
  // Who walks off. Weighted rather than picked: boldness up, loyalty down,
  // proportional in both, and a floor so a dutiful cast still produces
  // somebody. One draw, so the stream does not depend on the cast.
  const weights = living.map(n => SEARCH_FLOOR
    + SEARCH_BOLD * (stat(n, 'boldness') / 10) * (1 - SEARCH_LOYAL * (stat(n, 'loyalty') / 10)));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  let searcher = living[living.length - 1];
  for (let i = 0; i < living.length; i++) {
    roll -= weights[i];
    if (roll <= 0) { searcher = living[i]; break; }
  }
  // THE ROLL STILL HAPPENS on a ticked afternoon and its result is overridden,
  // never skipped: skipping the draw would consume one fewer number and re-roll
  // every murder and ballot after it (the coupling `_missionRngFor` exists to
  // prevent). Ticking "Shield" on an episode means there IS one that day —
  // otherwise the searcher comes back empty a fifth of the time and the control
  // silently does nothing, which is the defect this file has hit before.
  const forced = !!(gs?.tr?.shieldEpisodes && gs.tr.shieldEpisodes[ep]);
  const rolled = rng() < clamp01(FIND_BASE + FIND_PER_POINT * (stat(searcher, 'intuition') / 10));
  const found = forced ? true : rolled;

  const teams = [];
  // The same two teams scored a second way, with the searcher's hour put back
  // in. It costs no rng draw — the swing is drawn once and shared — and it is
  // what lets `runMission` RECORD the cost of the hunt instead of leaving it a
  // claim in a comment. A design whose whole point is that somebody pays for
  // the Shield should be able to say how much.
  const asIfPresent = [];
  for (let i = 0; i < split.length; i++) {
    const members = split[i];
    const swing = (rng() - 0.5) * SWING;
    const full = members.reduce((s, n) =>
      s + (0.55 * stat(n, m.primary) + 0.45 * stat(n, m.secondary)) / 10, 0);
    const mine = members.includes(searcher)
      ? (0.55 * stat(searcher, m.primary) + 0.45 * stat(searcher, m.secondary)) / 10 : 0;
    const denom = Math.max(1, members.length);
    teams.push({ name: m.teams[i], members, perf: clamp01((full - mine) / denom + swing) });
    asIfPresent.push(clamp01(full / denom + swing));
  }
  return { teams, searcher, found, asIfPresent };
}

// The afternoon's own account of somebody leaving the line. Both pools are
// claims about the CARRY and never about the Shield's consequences — whether
// anybody makes anything of it tonight is decided after the conclave, by
// people this file cannot see.
// {They} rather than {they} where a template starts a sentence with it: the
// pronoun table has both cases and the first dump printed "he came back up
// with something that was not a reliquary" mid-paragraph, with the full stop
// in front of it.
const SEARCH_FOUND = [
  '{who} was not on the stair for the last third of it. {They} came back up with something that was not a reliquary.',
  'Somewhere in the second hour {who} stopped carrying and started opening, and one of the caskets was the wrong weight.',
  '{who} left the line, went along the niches on {their} own, and found the one thing down there worth finding.',
  'The line was a body short for twenty minutes. {who} came back holding it, and did not put it down.',
];
const SEARCH_MISSED = [
  '{who} spent half the carry opening caskets alone and came back up with dust on {their} hands and nothing in them.',
  'Whatever {who} thought was down there, {they} did not find it — and the line noticed the gap where {they} should have been.',
  '{who} broke off to go looking, stayed gone a long time, and returned with an expression that answered the question.',
  'An hour of somebody else\'s work went undone while {who} searched the niches for something that was not in them.',
];

/**
 * Which tier of prose the afternoon deserves. Narration only.
 *
 * CUT AGAINST THE MEASURED DISTRIBUTION, not against the 0..1 the number
 * happens to live on. Quality over 3,491 missions runs p50 0.39, p90 0.50,
 * p99 0.60, max 0.76 — a mean of two teams either side of a difficulty
 * subtraction does not reach the ends of its own range and never will. The
 * first draft's cuts (0.75 / 0.45 / 0.15) meant `triumph` fired ZERO times in
 * 55 dumped missions and `failed` zero, so forty of the hundred lines in this
 * file were unreachable content — found by dumping seasons and reading them,
 * exactly as every prose defect in the previous plan was.
 *
 * At 0.55 / 0.40 / 0.15 the tiers fire roughly 4% / 46% / 48% / 2%. A triumph
 * stays rare enough to mean something and a washout stays rare enough to
 * hurt, and both now happen.
 */
function _tier(q) {
  if (q >= 0.55) return 'triumph';
  if (q >= 0.40) return 'solid';
  if (q >= PASS_MARK) return 'scraped';
  return 'failed';
}

/**
 * Optional extras, attempted by one person each and worth very little.
 *
 * They exist to give the mission a name attached to it — a season's mission
 * log that is nothing but team totals has no people in it — and they are
 * priced at ~1.5% of the ceiling apiece precisely so that they cannot become
 * the way a cast maxes the pot. Success is proportional to a stat, never a
 * threshold on one.
 */
// Templates rather than rendered strings, so the no-repeats memo below can
// compare them. Every one of these is followed by a BARE INFINITIVE, because
// the labels are infinitives — an earlier draft had "had a go at cross the
// last span" and "who did read the abbot's hand", which is what reading the
// output rather than the assertions catches.
const SIDE_WON = [
  '{who} managed to {what}, and was paid for it.',
  '{who} went and did the thing nobody was required to do: {what}.',
  'Nobody had to {what}. {who} did, and was paid for it.',
  '{who} broke off to {what}, and pulled it off.',
];
const SIDE_LOST = [
  '{who} tried to {what} and did not get there.',
  '{who} went for the extra — {what} — and came back with the story instead of the money.',
  'Nobody managed to {what}. {who} came closest, which pays nothing.',
  '{who} set out to {what}, briefly, and thought better of it.',
];
const _render = (tpl, who, what) => tpl.split('{who}').join(who).split('{what}').join(what);

/**
 * The Chess mission's tell lines, which need a pronoun as well as a name.
 *
 * `{they}` and `{them}` and `{their}` come from js/players.js's table rather
 * than from singular they everywhere, because a line reading "put a piece back
 * down" about a named person is the sort of sentence that gets read aloud.
 * Verb agreement is why every template using `{they}` is written around a form
 * that works for both ("{they} could", "once {they} had started") — the table
 * has no conjugator and inventing one for four lines would be the wrong trade.
 */
const _render3 = (tpl, who, pr) => tpl
  .split('{who}').join(who)
  .split('{they}').join(pr.sub)
  .split('{They}').join(pr.Sub)
  .split('{them}').join(pr.obj)
  .split('{their}').join(pr.posAdj);

/**
 * Pick a line this season has not printed lately.
 *
 * Four variants per category is only four variants if the season remembers
 * which it has spent: unmemoed, the first seed dumped printed "A single match,
 * found late, argued over" twice in one season.
 *
 * `window` IS THE PART THAT NEEDED A SECOND READING. A season-wide memo is
 * right for a summary — a given archetype comes up two or three times, so its
 * four lines are never exhausted — and WRONG for the side-objective pool,
 * which is drawn about fourteen times a season from four templates. Once
 * everything is used the fallback fires on every remaining draw, and the
 * second dump had one mission print "set out to ... and thought better of it"
 * for BOTH of its objectives. A window of 2 on that pool means a template
 * cannot come back until two others have gone by, which is a guarantee rather
 * than a preference, and still leaves two lines to choose between.
 */
function _freshPick(rng, pool, window = 0) {
  if (!Array.isArray(gs.tr.missionLines)) gs.tr.missionLines = [];
  const used = gs.tr.missionLines;
  const mine = used.filter(t => pool.includes(t));
  const recent = window ? mine.slice(-window) : mine;
  const fresh = pool.filter(t => !recent.includes(t));
  const chosen = pick(rng, fresh.length ? fresh : pool);
  used.push(chosen);
  return chosen;
}

function _runSideObjectives(m, teams, rng, exclude = null) {
  // The searcher is off down the niches and cannot also be the one taking the
  // top step alone — a record that says both is a record contradicting itself,
  // which is the defect class this plan has now found three times.
  const field = teams.flatMap(t => t.members).filter(n => n !== exclude);
  const out = [];
  const count = rng() < 0.45 ? 2 : 1;
  const chosen = [];
  for (let i = 0; i < count && i < m.side.length; i++) {
    const spec = m.side[i];
    const candidates = field.filter(n => !chosen.includes(n));
    if (!candidates.length) break;
    const who = pick(rng, candidates);
    chosen.push(who);
    const p = 0.06 + (stat(who, spec.stat) / 10) * 0.62;
    const achieved = rng() < p;
    out.push({
      id: spec.id, player: who, stat: spec.stat, achieved,
      bonus: achieved ? SIDE_BONUS : 0,
      line: _render(_freshPick(rng, achieved ? SIDE_WON : SIDE_LOST, 2), who, spec.label),
    });
  }
  return out;
}

/**
 * What the searcher's absence cost the pot, in credits.
 *
 * Scores the SAME afternoon with the searcher's hour put back in and takes the
 * difference in gross. Never negative: the searcher's contribution can only
 * raise a team's mean, and `quality` is monotone in the blend. Side objectives
 * are excluded from both sides — they are the same either way — so the number
 * is the carry and nothing else.
 */
function _reliquaryCost(reliquary) {
  const q = (perfs) => {
    const blend = BEST_WEIGHT * Math.max(perfs[0], perfs[1])
      + (1 - BEST_WEIGHT) * Math.min(perfs[0], perfs[1]);
    const quality = clamp01((blend - DIFFICULTY) / (1 - DIFFICULTY));
    return Math.round(MISSION_MAX * (quality < PASS_MARK ? 0 : quality));
  };
  return Math.max(0, q(reliquary.asIfPresent) - q(reliquary.teams.map(t => t.perf)));
}

/**
 * Run one mission and pay the pot.
 *
 * Returns `{ id, ep, name, teams, quality, earned, potAfter, sideObjectives,
 * summary }`, or null when there is nobody to run one with. `earned` is what
 * the pot ACTUALLY took, which is not always what the room won: the ceiling is
 * applied here and nowhere else, so a season that arrives at the last mission
 * with 4,000 of headroom banks 4,000 of a 15,000 afternoon and the rest is
 * simply gone. That is the intended shape — the ceiling is a cap on the prize,
 * not a budget the season is scheduled against.
 *
 * `rng` MUST be the missions' own stream (headless.js `_missionRngFor`). Every
 * draw here would otherwise displace the murder and the ballots.
 */
export function runMission(ep, rng) {
  if (!_enabled) return null;
  if (!gs?.tr) return null;
  const living = [...(gs.activePlayers || [])];
  if (living.length < MIN_PLAYERS) return null;

  // ── THE BESPOKE AFTERNOON, FIRST ─────────────────────────────────────
  // Chosen before the archetype rotation and off the SAME rng stream, so
  // enabling the catalogue reshuffles the missions' own stream and touches no
  // game draw (they run off `_missionRngFor`, headless.js). A bespoke mission
  // pays its pot inside `simulate` (through the shared `payPot`), records
  // itself, and has its declared effects applied through the scene API. The
  // shield gate rides on the same `_shieldMission` switch the archetype
  // Reliquary sits behind, via `ctx.shieldsEnabled`.
  // ── COMBINED POOL: BOTH GENERIC AND BESPOKE (user decision) ──────────
  // Not either/or any more. A night draws bespoke-vs-generic proportional to
  // pool size (4 bespoke : 7 generic today), so both kinds appear across a
  // season and future bespoke naturally weight up as they are added. The roll
  // is one draw off the MISSION rng (missions run off `_missionRngFor`, so it
  // reshuffles the mission stream without touching a game draw). An ineligible
  // bespoke pick falls through to the generic archetype below.
  // ── THE AUTHOR'S MISSION, if the episode-format designer pinned one ──
  // `gs.tr.missionSchedule` (episode -> mission id) comes from the timeline's
  // per-episode dropdown via js/tr-run.js. A scheduled BESPOKE id forces the
  // bespoke branch (when it is eligible tonight); a scheduled GENERIC id forces
  // that archetype below and skips the bespoke roll entirely. An unknown or
  // ineligible id falls through to the ordinary random draw, so a pinned
  // mission the room cannot run tonight is a normal afternoon, never a crash.
  const scheduledId = (gs.tr.missionSchedule && gs.tr.missionSchedule[ep]) || null;
  const scheduledIsBespoke = scheduledId && BESPOKE_MISSION_IDS.includes(scheduledId);
  const scheduledIsGeneric = scheduledId && MISSION_IDS.includes(scheduledId);

  if (bespokeMissionsEnabled()) {
    const nBespoke = BESPOKE_MISSION_IDS.length;
    const nGeneric = MISSION_IDS.length;
    // A scheduled generic skips the bespoke branch; a scheduled bespoke takes
    // it; with nothing scheduled it is the proportional roll as before.
    const takeBespoke = scheduledId
      ? scheduledIsBespoke
      : rng() < nBespoke / (nBespoke + nGeneric);
    if (takeBespoke) {
      const lastId = Array.isArray(gs.tr.missions) && gs.tr.missions.length
        ? gs.tr.missions[gs.tr.missions.length - 1].id : null;
      const ctx = createMissionCtx({
        ep, living,
        alignmentOf: (name, e) => alignmentAt(name, e),
        shieldsEnabled: _shieldMission,
      });
      // A pinned bespoke runs only if it is eligible tonight; otherwise it
      // falls through to the generic draw rather than being forced to misfire.
      let chosen = null;
      if (scheduledIsBespoke) {
        const want = bespokeMission(scheduledId);
        try { if (want && want.eligibility(ctx) !== false) chosen = want; } catch { chosen = null; }
      } else {
        chosen = pickBespokeMission(ctx, rng, lastId);
      }
      if (chosen) {
        const rec = chosen.simulate(ctx, rng);
        if (!Array.isArray(gs.tr.missions)) gs.tr.missions = [];
        gs.tr.missions.push(rec);
        applyMissionEffects(rec, ep);
        return rec;
      }
    }
  }

  const m = (scheduledIsGeneric && ARCHETYPES.find(a => a.id === scheduledId)) || _chooseArchetype(rng, ep);
  // The knowledge archetype scores off per-player boards instead of the stat
  // pair, because the dilemma has to be able to move the money: a Traitor who
  // throws their board really does cost the castle part of the pot, which is
  // the sabotage half of spec 4.4's fourth source.
  const chess = m.knowledge ? _runChess(m, living, ep, rng) : null;
  // And the power archetype scores off a team that is a body short, because
  // somebody left it. See _runReliquary.
  const reliquary = m.power === 'shield' ? _runReliquary(m, living, rng, ep) : null;
  const teams = chess ? chess.teams : (reliquary ? reliquary.teams : _drawTeams(living, m, rng));
  const best = Math.max(teams[0].perf, teams[1].perf);
  const worst = Math.min(teams[0].perf, teams[1].perf);
  const blend = BEST_WEIGHT * best + (1 - BEST_WEIGHT) * worst;
  const quality = clamp01((blend - DIFFICULTY) / (1 - DIFFICULTY));

  const sideObjectives = _runSideObjectives(m, teams, rng, reliquary?.searcher || null);
  const gross = Math.round(MISSION_MAX * (quality < PASS_MARK ? 0 : quality))
    + sideObjectives.reduce((s, o) => s + o.bonus, 0);

  const ceiling = typeof gs.tr.potCeiling === 'number' && gs.tr.potCeiling > 0
    ? gs.tr.potCeiling : POT_CEILING;
  const room = Math.max(0, ceiling - (gs.tr.pot || 0));
  const earned = Math.min(gross, room);
  gs.tr.pot = (gs.tr.pot || 0) + earned;

  // THE TIER IS RECORDED, NOT RECOMPUTED BY THE READER. A test that re-derives
  // the tier from `quality` with its own copy of the cuts is a test of its own
  // arithmetic: move the cut in _tier so a whole tier goes unreachable — Task
  // 1's actual defect, forty dead lines — and such a test stays green because
  // it never asked which pool the sentence came out of. The VP will want this
  // field anyway.
  const tier = _tier(quality);
  // WHICH HALF OF THE ROOM HAD THE BETTER AFTERNOON — recorded here for the
  // same reason `tier` is, one line up. The money is deliberately not scored
  // off the winner (see BEST_WEIGHT), but there IS a better team, and a
  // career's `missionsWon` is a count of the afternoons you were on it. A
  // reader that re-derived that from `teams[].perf` would be holding its own
  // copy of the tie rule, and the two would drift the first time either moved.
  const bestTeam = teams[0].perf >= teams[1].perf ? teams[0].name : teams[1].name;
  const rec = {
    // THE STATS THE AFTERNOON WAS SCORED ON, carried so the Armoury can rank
    // "who did best today" on the mission's own terms instead of inventing a
    // second opinion about it (js/tr/armoury.js `_contribution`).
    primary: m.primary || null, secondary: m.secondary || null,
    id: m.id, ep, name: m.name, teams, quality, tier, bestTeam,
    // WHAT THE AFTERNOON PHYSICALLY WAS. The brief card names the mission
    // and the outcome lines say how it went; without this the viewer is
    // never told what the task actually asked people to do.
    task: m.task || null,
    gross, earned, potAfter: gs.tr.pot, sideObjectives,
    summary: _freshPick(rng, m.lines[tier]),
  };
  if (chess) {
    // THE OBSERVABLE, and nothing more. `tells` carries a name, a direction
    // and a magnitude; `readers` carries who solved their own board. There is
    // no alignment on either, and neither is a belief — turning them into one
    // is `missionEvidence()` in js/tr/deduction.js.
    rec.tells = chess.tells;
    rec.readers = chess.readers;
    // Prose. The quiet line is reachable ONLY when there is genuinely nothing
    // to read, and the solvers line only names people who genuinely solved,
    // so neither can contradict the record printed beside it.
    rec.tellLines = chess.tells.map(t => t.line);
    if (!chess.tells.length) rec.tellLines.push(_freshPick(rng, CHESS_QUIET));
    else if (chess.readers.length) {
      rec.tellLines.push(_render(
        _freshPick(rng, chess.readers.length === 1 ? CHESS_SOLVER_ONE : CHESS_SOLVERS),
        _andList(chess.readers), ''));
    }
  }
  if (reliquary) {
    // THE ACQUISITION PATH, and the only thing a mission has ever handed a
    // player. `awardShield` decides who saw it and grants the Shield through
    // js/tr/murder.js's existing `grantShield`; what is recorded here is the
    // afternoon — who went looking and whether they came back with anything.
    // The `shield` key is the ONE immunity-shaped field a mission record is
    // allowed to carry, and tests/tr-missions.test.js names it explicitly
    // rather than loosening the scan that used to forbid all of them.
    //
    // WHICH RELIC IS DOWN THERE IS DECIDED BY THE SEASON, NOT BY THE SEARCH,
    // and the record carries exactly one of the two keys so that no sentence
    // can end up describing the wrong afternoon. A Dagger afternoon writes
    // `rec.dagger` and no `rec.shield` at all — including when the searcher
    // comes back empty, because what they failed to find was a Dagger. Reading
    // it the other way round is how "the hour bought nothing" ends up printed
    // over a prize, which is the defect class this plan carries a standing
    // requirement for.
    //
    // The find and miss prose is shared on purpose rather than duplicated:
    // SEARCH_FOUND says "something that was not a reliquary" and never says
    // what, because from the top of the stair nobody can tell.
    // A TICKED AFTERNOON IS A SHIELD AFTERNOON, not a Dagger one. The relic
    // slot is shared, so without this the tick lost about one time in six to a
    // Dagger day and the author got a relic they did not ask for. The call
    // still happens so its draws are consumed and the stream is unchanged.
    const _daggerDay = daggerAfternoon(living);
    const isDagger = (gs?.tr?.shieldEpisodes && gs.tr.shieldEpisodes[ep])
      ? false : _daggerDay;
    const won = reliquary.found
      ? (isDagger
        ? awardDagger(reliquary.searcher, teams, ep, rng)
        : awardShield(reliquary.searcher, teams, ep, rng))
      : null;
    rec[isDagger ? 'dagger' : 'shield'] = {
      searcher: reliquary.searcher,
      found: reliquary.found,
      // WHAT THE HUNT COST THE CASTLE, in the pot's own currency, recorded per
      // afternoon rather than recomputed by whoever wants to know. Positive on
      // every Reliquary, including the ones the searcher came back from empty
      // — the hour is spent either way, which is what makes breaking away a
      // gamble and not a purchase. Measured mean ~1,100 credits, about 15% of
      // the afternoon.
      cost: _reliquaryCost(reliquary),
      holder: won ? won.holder : null,
      witnesses: won ? [...won.witnesses] : [],
      visibility: won ? won.visibility : null,
      lines: [
        _render3(_freshPick(rng, reliquary.found ? SEARCH_FOUND : SEARCH_MISSED, 2),
          reliquary.searcher, pronouns(reliquary.searcher)),
        ...(won ? [won.seenLine] : []),
      ],
    };
  }
  if (!Array.isArray(gs.tr.missions)) gs.tr.missions = [];
  gs.tr.missions.push(rec);
  return rec;
}
