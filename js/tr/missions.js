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
//   * It writes NO beliefs. None — not alignment, not at any credibility.
//     A later task adds one archetype whose currency is knowledge, and it
//     emits `deduced`/`rumor` only; the Seer is the game's single `observed`
//     alignment write and it is not this file's business.
//   * It writes NO bonds and touches NO player state. A mission's entire
//     footprint on a season is `gs.tr.pot` and `gs.tr.missions`. That is
//     asserted directly in tests/tr-missions.test.js by playing every season
//     twice, missions on and missions off, and demanding a bit-identical log
//     of who was banished and who died. It is the strongest available form of
//     "a mission cannot grant immunity": it cannot grant anything.
//   * It never consumes the game's own rng. Missions are handed their own
//     hashed stream by headless.js (`_missionRngFor`) for the same reason the
//     castle layer has one — a draw taken here would re-roll every murder,
//     ballot and banishment after it, and the calibration bands would move on
//     a content edit rather than on an engine change.
import { gs } from '../core.js';
import { pStats } from '../players.js';

/**
 * The most a season's missions can ever be worth.
 *
 * A round number in the show's own currency rather than a tuned one — the
 * tuning lives in MISSION_MAX below, which is what actually decides how close
 * a season gets. Read `gs.tr.potCeiling` at runtime rather than importing this
 * constant into gameplay code, so a future format that shortens a season can
 * scale the ceiling with it.
 */
export const POT_CEILING = 120000;

/** The most any ONE mission can add before side objectives. ~13% of the pot. */
const MISSION_MAX = 15600;

/** What a completed side objective is worth. Deliberately small: ~1.5%. */
const SIDE_BONUS = 1800;

/**
 * How much of a team's raw competence is burnt off before a penny is paid.
 *
 * A mission scored on stats alone pays out around 55% of maximum for an
 * average cast, every time, and a season of that lands within a rounding
 * error of the ceiling. This is the subtraction that makes a mission possible
 * to FAIL: quality is measured from here upward, so an average performance is
 * a mediocre payday and a bad one is nothing at all.
 */
const DIFFICULTY = 0.34;

/** Below four living players there is nobody to make two teams out of. */
const MIN_PLAYERS = 4;

/**
 * Below this, the mission pays NOTHING — and the number exists because of a
 * prose defect, not a balance one.
 *
 * The `failed` narration says "not one box cleared the water" and "nothing
 * lit, nothing earned". Without a pass mark those lines print over a payment
 * of two thousand credits, and the summary contradicts the ledger printed
 * underneath it — the same defect class as the grief event that announced two
 * empty beds on a night with three (see js/tr/state.js). A mission is a task:
 * the room completes it or it does not, and a botched afternoon buys the
 * castle nothing. Now the sentence and the number agree.
 *
 * Costs the pot about half a point of the ceiling, because it only bites on
 * the worst ~2% of missions. Side objectives are NOT gated by it: one person
 * bagging the extra out of a washout is coherent, and it is the only thing
 * salvaged from a day like that.
 */
const PASS_MARK = 0.15;

/**
 * Where the payday actually comes from: not the winners, and not an average.
 *
 * 0.6 on the better team and 0.4 on the worse. Weighting it entirely on the
 * winner would make half the cast irrelevant to the money and remove the one
 * thing that makes a mission a shared enterprise; weighting it evenly would
 * make a single strong team pointless. This says: the room is paid for what
 * the room managed, and the stronger half matters more.
 */
const BEST_WEIGHT = 0.6;

/** How wide the luck is on a team's day. +/- 9 points of performance. */
const SWING = 0.18;

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
];

/** Every archetype id, for tests and for anything enumerating the catalogue. */
export const MISSION_IDS = ARCHETYPES.map(m => m.id);

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

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const pick = (rng, arr) => arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
const stat = (name, key) => {
  const v = pStats(name)?.[key];
  return typeof v === 'number' && isFinite(v) ? v : 5;
};

/** Which archetype runs, never the one that ran last. */
function _chooseArchetype(rng) {
  const last = gs?.tr?.missions?.length ? gs.tr.missions[gs.tr.missions.length - 1].id : null;
  const pool = ARCHETYPES.filter(m => m.id !== last);
  return pick(rng, pool.length ? pool : ARCHETYPES);
}

/** Two teams out of the living, in a seeded shuffle. Uneven casts split 1 over. */
function _drawTeams(living, m, rng) {
  const order = [...living];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const half = Math.ceil(order.length / 2);
  return [order.slice(0, half), order.slice(half)].map((members, i) => ({
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

function _runSideObjectives(m, teams, rng) {
  const field = teams.flatMap(t => t.members);
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

  const m = _chooseArchetype(rng);
  const teams = _drawTeams(living, m, rng);
  const best = Math.max(teams[0].perf, teams[1].perf);
  const worst = Math.min(teams[0].perf, teams[1].perf);
  const blend = BEST_WEIGHT * best + (1 - BEST_WEIGHT) * worst;
  const quality = clamp01((blend - DIFFICULTY) / (1 - DIFFICULTY));

  const sideObjectives = _runSideObjectives(m, teams, rng);
  const gross = Math.round(MISSION_MAX * (quality < PASS_MARK ? 0 : quality))
    + sideObjectives.reduce((s, o) => s + o.bonus, 0);

  const ceiling = typeof gs.tr.potCeiling === 'number' && gs.tr.potCeiling > 0
    ? gs.tr.potCeiling : POT_CEILING;
  const room = Math.max(0, ceiling - (gs.tr.pot || 0));
  const earned = Math.min(gross, room);
  gs.tr.pot = (gs.tr.pot || 0) + earned;

  const rec = {
    id: m.id, ep, name: m.name, teams, quality,
    gross, earned, potAfter: gs.tr.pot, sideObjectives,
    summary: _freshPick(rng, m.lines[_tier(quality)]),
  };
  if (!Array.isArray(gs.tr.missions)) gs.tr.missions = [];
  gs.tr.missions.push(rec);
  return rec;
}
