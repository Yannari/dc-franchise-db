// ══════════════════════════════════════════════════════════════════════
// tr/missions/ash-vault.js — The Ash Vault
// ══════════════════════════════════════════════════════════════════════
//
// The east wing burned forty years ago and was never cleared. Under the fallen
// roof there is a strongroom, and in the strongroom there are deed boxes, and
// somewhere in the flue beside it — according to the housekeeper who was the
// last person out of the building — there is a ring.
//
// THE ONE BESPOKE MISSION THAT HANDS SOMEBODY A POWER, and the only one, for
// the same reason exactly one archetype does: a Shield that turns up every
// afternoon is not a prize, it is the weather. What makes this the right
// mission to carry it is that the Shield here is not a reward for winning —
// it is a THEFT FROM THE CARRY. The flue is a different hole from the one the
// deed boxes come out of, and a body in the flue is a body not on the relay.
// The team's crawl score is computed with that person's hour missing and the
// denominator does NOT shrink to cover for them, so the castle pays for the
// Shield out of the pot, including the people who never knew it was down
// there. That is spec 7.2's structural sting arriving one layer further in,
// and it is the same accounting `_runReliquary` uses, deliberately, so the
// measured cost of a hunt stays one number and not two.
//
// WHY THE PHASES ARE THESE PHASES. The shoring is physical and loyalty
// (holding a prop steady over somebody else's head is a stat and a decision);
// the crawl is endurance and temperament in the dark; the sort is mental and
// social on the lawn afterwards, because forty years of water damage means
// half the deeds are illegible and the team has to agree which. Three
// different pairs, equally weighted, and the last one is scored on a table in
// daylight where everybody can see everybody — which is where an argument
// about who was in the flue actually happens.
//
// WHAT A TRAITOR CAN DO. Under-prop a bay. It is the commonest honest mistake
// in the shoring (a prop that looks seated and is not) and it is the only
// sabotage available, and it costs crawl time rather than causing an accident,
// because a mission that could injure somebody is a mission whose stakes are
// not the pot. Nudge, never switch.

import {
  briefingText, clamp01, freshPick, hostDo, hostSay, PHASE_SWING,
  MISSION_MAX, PASS_MARK,
  missionQuality, missionScene, noisyPair, payPot, placementsFrom,
  pronounSlots, render, splitTeams, statOf, validateMissionRecord, weightedPick,
} from './contract.js';
import { awardShield } from '../powers.js';

const TEAMS = ['Cinder', 'Flint'];

/** Deed boxes down there. Scales with the room. */
const boxesFor = n => Math.max(5, Math.min(14, Math.round(n * 0.8)));

// ══════════════════════════════════════════════════════════════════════
// THE BRIEFING — and it is the briefing that puts the ring in the room
// ══════════════════════════════════════════════════════════════════════
//
// THE HOST MENTIONS THE FLUE AND DOES NOT RECOMMEND IT. That is the whole
// design of the beat: the rule has to be public — everybody must know the
// option exists, or somebody breaking away is an unexplained absence rather
// than a decision — and the host must not tell them what it is worth, because
// the price of a Shield is that you spend an hour you cannot get back on a
// story a dead housekeeper told.
function _ceremony(boxes) {
  const hostBeats = [
    hostDo('What is left of the east wing. The host stands on a scaffold walkway above a '
      + 'collapsed floor, with the burnt roof timbers still in place above them.'),
    hostSay('This wing burned in one night forty years ago and nobody has been inside it '
      + 'since, because until last week nobody could get inside it.'),
    hostDo('The host points down at a black opening between two fallen beams.'),
    hostSay(`Down there is the strongroom. In the strongroom are ${boxes} deed boxes. `
      + 'Between you and them is a ceiling that has been coming down slowly for four '
      + 'decades and will keep doing that whether or not you are underneath it.'),
    hostSay('So first you prop it. There are timbers and jacks on the walkway. Every bay '
      + 'you shore properly is a bay you can crawl through; a jack that is not seated '
      + 'will look seated, and the first person through will find out that it is not, '
      + 'and that bay closes for the rest of the afternoon.'),
    hostDo('The host crouches at the mouth of the crawl and puts a hand flat on the floor '
      + 'of it.'),
    hostSay('Then you crawl. One at a time, on your front, with a box behind you. It is '
      + 'sixty feet, it is dark, and you will not be able to turn round. If you stop, '
      + 'the person behind you stops.'),
    hostDo('The host stands and indicates a second, narrower opening in the brickwork to '
      + 'one side.'),
    hostSay('That is the old kitchen flue. The housekeeper who came out of this building '
      + 'last said she left a ring in it. I have no idea whether she did. Any one of you '
      + 'may go and look, and if you find it, it is a Shield, and it is yours alone.'),
    hostSay('I will tell you what it costs, because that part I do know. While you are in '
      + 'the flue you are not on the relay, and your team crawls a body short, and the '
      + 'boxes you would have brought out stay down there.'),
    hostDo('The host walks to a trestle table set up on the lawn outside.'),
    hostSay('Whatever comes out gets sorted on this table. Forty years of water has made '
      + 'most of those deeds illegible and some of them are simply blank paper. Only a '
      + 'deed you can still read earns anything.'),
    hostSay('Every readable deed on this table when I close the wing is two and a half '
      + 'thousand into the pot. The team that finishes with the most has bragging rights '
      + 'and nothing else. Prop it properly.'),
  ];
  return {
    ceremonyId: 'mission-brief-ash-vault',
    staging: 'A scaffold walkway over the collapsed floor of a burnt-out wing, with jacks '
      + 'and timbers stacked on it, a low crawl opening between two fallen beams, a '
      + 'narrower flue opening in the brickwork beside it, and a trestle table on the '
      + 'lawn outside.',
    hostBeats,
    contestantBeats: [],
    rulePoints: [
      { id: 'task', explainedByBeat: 3 },
      { id: 'failure', explainedByBeat: 4 },
      { id: 'crawl', explainedByBeat: 6 },
      { id: 'shield', explainedByBeat: 8 },
      { id: 'cost', explainedByBeat: 9 },
      { id: 'reward', explainedByBeat: 12 },
      { id: 'finish', explainedByBeat: 12 },
    ],
    revealBeats: hostBeats.length,
    reminder: 'The host reminds the room that an unseated jack closes its bay, that the flue '
      + 'costs the team the searcher\'s hour, and that only a readable deed pays.',
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 1 — THE SHORING. physical and loyalty, over each other's heads.
// ══════════════════════════════════════════════════════════════════════
const SHORE_GOOD = [
  '{who} seated the jack, put weight on it, and then put more weight on it, which is the difference between a prop and a decoration.',
  '{who} shored two bays in the time the rest of the walkway shored one, and both of them held all afternoon.',
  '{who} would not sign off a bay {they} had not personally stood under.',
  '{who} found the beam that was carrying everything and propped that first, which nobody had asked for.',
];
const SHORE_BAD = [
  '{who} set a jack on burnt board. It looked seated. It was not, and the bay behind it shut an hour later.',
  '{who} was working faster than the timber allowed and left a prop a finger short of the joist.',
  '{who} shored the bay that was easiest to reach rather than the one that mattered.',
  '{who} put a jack in and did not test it, and the first person through the bay found out for {them}.',
];
const SHORE_UNDER = [
  '{who} stood under {other}\'s prop while {other} seated it, which is what you do and is not nothing.',
  '{other} could not hold the timber and get the jack under it. {who} took the timber.',
  '{who} spent the whole shoring holding things over other people rather than doing anything anybody would remember.',
];

function _shoring(ctx, rng, teams) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  const bays = {};
  for (const t of teams) {
    let open = 0;
    let firstBad = null;
    for (const name of t.members) {
      const v = noisyPair(rng, name, 'physical', 'loyalty');
      contrib[name] = clamp01(v / 10) * 10;
      const slots = pronounSlots(name);
      const nudge = ctx.conflicted(name) ? 0.09 : 0;
      const seated = rng() < clamp01(0.14 + 0.068 * v - nudge);
      if (seated) {
        open += 1;
        beats.push({ team: t.name, player: name, kind: 'good', score: v,
          text: render(freshPick(rng, SHORE_GOOD), slots) });
      } else {
        if (!firstBad) firstBad = name;
        contrib[name] = Math.max(0, contrib[name] - 1.6);
        beats.push({ team: t.name, player: name, kind: 'bad', score: v,
          text: render(freshPick(rng, SHORE_BAD), slots) });
      }
    }
    bays[t.name] = open;

    // Somebody held a timber over somebody else. Warm, cheap, and it has a
    // consequence — the standing rule that no beat is purely cosmetic.
    if (t.members.length >= 2) {
      const ranked = [...t.members].sort((a, b) => contrib[b] - contrib[a]);
      const other = ranked[ranked.length - 1];
      const who = weightedPick(rng, t.members.filter(n => n !== other),
        n => 0.3 + statOf(n, 'loyalty') / 7);
      contrib[who] += 0.9;
      scenes.push(missionScene({
        id: `vault-shore-under-${t.name}`,
        eventId: 'vault-timber-held-overhead',
        phase: 'shoring',
        participants: [who, other],
        behaviour: 'heroic',
        text: render(freshPick(rng, SHORE_UNDER), { ...pronounSlots(who), other }),
        effects: [
          { kind: 'bond', players: [who, other], delta: 0.6,
            source: `${who} stood under ${other}'s prop while it was seated` },
          { kind: 'crowd', name: who, colour: 'heroic', mult: 0.5,
            source: `${who} held timbers over other people for the whole shoring` },
        ],
        confessional: {
          purpose: 'character', speaker: who,
          text: "Nobody's cutting a highlight reel of me holding a bit of wood over "
            + "somebody's head for an hour. It was still the job and I did it.",
        },
      }));
    }

    // AND THE BAY THAT SHUT, if one did — named, with the person who set it,
    // because the mission-blame rule requires a recorded phase result before
    // anybody may be blamed for one.
    if (firstBad) {
      const witnesses = t.members.filter(n => n !== firstBad);
      if (witnesses.length) {
        const finder = weightedPick(rng, witnesses, n => 0.3 + statOf(n, 'intuition') / 8);
        scenes.push(missionScene({
          id: `vault-shore-collapse-${t.name}`,
          eventId: 'vault-bay-closed',
          phase: 'shoring',
          participants: [finder, firstBad],
          behaviour: 'suspicious',
          text: `${finder} was the one who found the bay shut, and the jack in it was a `
            + `finger short of the joist. ${firstBad} set that jack.`,
          effects: [
            { kind: 'record', player: firstBad, field: 'unseatedJack', value: true,
              source: `${firstBad} set a jack that was not seated and the bay closed` },
            { kind: 'suspicion', observer: finder, subject: firstBad, delta: 0.28,
              source: `the bay ${firstBad} shored shut with the crawl already running` },
            { kind: 'bond', players: [finder, firstBad], delta: -0.4,
              source: `${finder} found ${firstBad}'s prop short of the joist` },
          ],
          confessional: {
            purpose: 'belief-change', speaker: finder,
            text: "You put the jack under and you push it until it stops. That's the whole "
              + `job. I don't understand how ${firstBad} got that wrong, and I'd like to.`,
          },
        }));
      }
    }
  }

  const score = t => t.members.reduce((s, n) => s + contrib[n], 0) / Math.max(1, t.members.length);
  return {
    phase: {
      id: 'shoring', name: 'The Shoring',
      setting: 'A scaffold walkway over a collapsed floor, with acrow jacks and timbers, '
        + 'under a burnt roof that has been coming down for forty years.',
      stats: ['physical', 'loyalty'],
      beats,
      bays: { ...bays },
      teams: teams.map(t => ({ name: t.name, score: clamp01(score(t) / 10), bays: bays[t.name] })),
    },
    contrib, scenes, bays,
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 2 — THE CRAWL. endurance and temperament, and one person leaves.
// ══════════════════════════════════════════════════════════════════════
//
// THE SEARCHER IS DRAWN ONCE FROM THE WHOLE ROOM, not once per team, and the
// weighting is boldness up and loyalty down with a floor — the same shape
// `_runReliquary` uses, and the floor is why a dutiful cast still produces
// somebody. One draw so the stream does not depend on the cast size.
//
// THE COST IS SCORED, NOT ASSERTED. The searcher's team is scored twice: once
// as played, and once with their hour put back in. The difference in gross is
// what the hunt cost the castle and it goes on the record, because a design
// whose whole point is that somebody pays for the Shield should be able to say
// how much.
const CRAWL_STRONG = [
  '{who} did the sixty feet three times and came out the third time still able to speak.',
  '{who} went in first, without being asked, and set a pace the rest of the relay could actually hold.',
  '{who} took the bay with the lowest headroom because {they} were the only one who would.',
  '{who} dragged two boxes out on one run, which is not possible and was witnessed.',
];
const CRAWL_STOP = [
  '{who} stopped about forty feet in, and the relay stopped behind {them}, and it was a long two minutes.',
  '{who} got halfway, could not make {their} shoulders work, and had to be pulled out backwards by the ankles.',
  '{who} did not go in. {who} stood at the mouth of it and said, quite reasonably, that {they} could not.',
  'The dark got {who}. There is no shame in it and there was also no box.',
];
const CRAWL_PULL = [
  '{who} went in after {other} and came out backwards dragging {them} by the belt.',
  'When {other} stopped, {who} talked to {them} through sixty feet of brick until {they} moved again.',
  '{who} gave up {their} own run to go in and get {other} out, and did not mention it afterwards.',
];
const FLUE_FOUND = [
  '{who} was not on the relay for most of the second hour. {They} came out of the flue with a hand closed.',
  'Somewhere in the middle of it {who} stopped carrying and started reaching up a chimney, and the housekeeper had been telling the truth.',
  '{who} went into the flue on a forty-year-old story and came back out with the story in {their} fist.',
];
const FLUE_MISSED = [
  '{who} spent an hour in a chimney and came out of it black to the elbow with nothing in {their} hands.',
  'Whatever {who} thought was up there, it was not. The relay was a body short the whole time {they} were looking.',
  '{who} broke off to go up the flue, stayed gone, and came back with an expression that answered the question.',
];

function _crawl(ctx, rng, teams, bays, boxes) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  const teamBoxes = {};
  for (const t of teams) t.members.forEach(n => { contrib[n] = 0; });

  const living = teams.flatMap(t => t.members);
  const searcher = weightedPick(rng, living,
    n => 0.35 + 0.9 * (statOf(n, 'boldness') / 10) * (1 - 0.6 * (statOf(n, 'loyalty') / 10)));
  const found = rng() < clamp01(0.18 + 0.030 * statOf(searcher, 'intuition'));

  const raw = {};      // as played: the searcher contributes nothing
  const asIf = {};     // the same afternoon with their hour put back in
  for (const t of teams) {
    // HOW MUCH OF THE CRAWL IS OPEN, and the floor is 0.55 rather than 0.35.
    // At 0.35 an average shoring left this phase scoring 0.39 against 0.57 and
    // 0.62 for the two either side of it, which pulled the mission's quality to
    // 0.29 and made `triumph` unreachable — a quarter of the summary lines in
    // this file were unprintable. Measured over 400 afternoons, before and
    // after. A badly shored wing should be slower, not a different mission.
    const cap = clamp01(0.62 + 0.38 * (bays[t.name] / Math.max(1, t.members.length)));
    let out = 0;
    const stalled = [];
    let mine = 0;
    let full = 0;
    for (const name of t.members) {
      const v = noisyPair(rng, name, 'endurance', 'temperament');
      const runs = clamp01(v / 10) * cap * 10;
      full += runs;
      if (name === searcher) { mine = runs; continue; }
      contrib[name] = runs;
      const slots = pronounSlots(name);
      if (v >= 7.2) {
        out += 2;
        beats.push({ team: t.name, player: name, kind: 'strong', score: v,
          text: render(freshPick(rng, CRAWL_STRONG), slots) });
      } else if (v <= 3.6) {
        stalled.push(name);
        beats.push({ team: t.name, player: name, kind: 'stop', score: v,
          text: render(freshPick(rng, CRAWL_STOP), slots) });
      } else {
        out += 1;
        beats.push({ team: t.name, player: name, kind: 'steady', score: v,
          text: `${name} made ${slots.their} runs, got a box out each time, and said nothing `
            + 'about the headroom.' });
      }
    }
    teamBoxes[t.name] = Math.max(0, Math.min(Math.ceil(boxes / 2), out));
    const denom = Math.max(1, t.members.length);
    raw[t.name] = clamp01((full - mine) / denom / 10);
    asIf[t.name] = clamp01(full / denom / 10);

    // Somebody went in after somebody. Fires when there is a stall AND
    // somebody left to go in after them; both halves come off the record.
    if (stalled.length) {
      const other = stalled[0];
      const pool = t.members.filter(n => n !== other && n !== searcher);
      // WHETHER ANYBODY GOES IN AFTER THEM IS A ROLL, not a guarantee. The
      // first draft had the rescue fire whenever the team had a spare body,
      // which made the stall a warm moment every single time and left
      // `cowardly` unreachable on this mission — caught by the behaviour-
      // reachability arm in tests/tr-missions-bespoke.test.js on its first run.
      // A relay where somebody always comes back for you is not a relay in a
      // burnt building, it is a trust exercise.
      const who = pool.length
        ? weightedPick(rng, pool, n => 0.3 + statOf(n, 'loyalty') / 7 + statOf(n, 'endurance') / 12)
        : null;
      const pulled = !!who && rng() < clamp01(0.22 + 0.048 * statOf(who, 'loyalty'));
      if (pulled) {
        contrib[who] += 1.3;
        scenes.push(missionScene({
          id: `vault-crawl-pull-${t.name}`,
          eventId: 'vault-pulled-out-of-the-crawl',
          phase: 'crawl',
          participants: [who, other],
          behaviour: 'heroic',
          text: render(freshPick(rng, CRAWL_PULL), { ...pronounSlots(who), other }),
          effects: [
            { kind: 'bond', players: [who, other], delta: 1.0,
              source: `${who} went into the crawl and brought ${other} out of it` },
            { kind: 'crowd', name: who, colour: 'heroic', mult: 1.2,
              source: `${who} gave up a run to pull ${other} out of the crawl` },
          ],
          confessional: {
            purpose: 'emotional-turn', speaker: other,
            text: "Sixty feet of brick and I couldn't move. I don't know how long I was in "
              + "there. I know whose voice it was.",
          },
        }));
      } else {
        // Nobody went in after them. The stall stands, and that is its own
        // scene — a phase result with nobody to soften it.
        scenes.push(missionScene({
          id: `vault-crawl-alone-${t.name}`,
          eventId: 'vault-stalled-with-nobody-behind',
          phase: 'crawl',
          participants: [other],
          behaviour: 'cowardly',
          text: render(freshPick(rng, CRAWL_STOP), pronounSlots(other))
            + ` The relay was a body short already, and ${t.name} lost the run.`,
          effects: [
            { kind: 'record', player: other, field: 'stalledCrawl', value: true,
              source: `${other} stopped in the crawl and the relay behind ${pronounSlots(other).them} stopped too` },
            { kind: 'crowd', name: other, colour: 'cowardly', mult: 0.6,
              source: `${other} could not finish the crawl` },
          ],
        }));
      }
    }
  }

  // THE HUNT ITSELF. Its scene names the searcher and no witnesses — who saw
  // it is decided by `awardShield` in js/tr/powers.js, which owns the
  // visibility model, and this file may not second-guess it.
  const slots = pronounSlots(searcher);
  scenes.push(missionScene({
    id: 'vault-flue-hunt',
    eventId: found ? 'vault-ring-found' : 'vault-flue-empty',
    phase: 'crawl',
    participants: [searcher],
    behaviour: 'selfish',
    text: render(freshPick(rng, found ? FLUE_FOUND : FLUE_MISSED), slots),
    effects: [
      { kind: 'record', player: searcher, field: 'leftTheRelay', value: true,
        source: `${searcher} left the relay for the kitchen flue and stayed gone` },
      { kind: 'crowd', name: searcher, colour: 'selfish', mult: 1,
        source: `${searcher} spent the crawl in the flue instead of on the relay` },
    ],
    confessional: {
      purpose: 'hidden-intent', speaker: searcher,
      text: found
        ? "They're all down there carrying boxes for money most of us won't live to collect. "
          + "I went and got the thing that keeps me here until Thursday."
        : "An hour. An hour up a chimney on the word of a woman who died in 1994, and I've "
          + "got nothing to show for it except the part they all watched.",
    },
  }));

  return {
    phase: {
      id: 'crawl', name: 'The Crawl',
      setting: 'Sixty feet of shored crawlspace in the dark, a relay of one person at a '
        + 'time, and a narrow brick flue leading off it.',
      stats: ['endurance', 'temperament'],
      beats,
      boxes: { ...teamBoxes },
      searcher,
      teams: teams.map(t => ({ name: t.name, score: raw[t.name], boxes: teamBoxes[t.name] })),
    },
    contrib, scenes, teamBoxes, searcher, found, raw, asIf,
  };
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 3 — THE SORT. mental and social, on a trestle table in daylight.
// ══════════════════════════════════════════════════════════════════════
//
// Only a deed you can still read pays, so the sort can cost the room boxes the
// crawl earned. And it happens in the open, in front of everybody, which is
// why it is the phase where the flue gets raised.
const SORT_SHARP = [
  '{who} held the sheets up to the light one at a time and found writing on three everybody else had binned.',
  '{who} worked out that the water had run one way down the pile, so the readable ones were all on the same side.',
  '{who} could read a hand nobody else could and did not make a performance of it.',
  '{who} rescued a deed by drying it on {their} own coat, which is not in the rules and worked.',
];
const SORT_DULL = [
  '{who} binned two readable deeds because the corners were black, which is not the same as illegible.',
  '{who} sorted by how bad each one looked rather than by whether there were words on it.',
  '{who} argued for twenty minutes that a blank sheet had writing on it.',
  '{who} was still on the first pile when the host closed the wing.',
];
const SORT_FLUE_RAISED = [
  '{other} asked {who}, across the table, in front of everybody, what exactly was up that chimney.',
  '{other} counted the boxes on the table, out loud, and then asked how many hands had been on the relay.',
  '{other} did not accuse {who} of anything. {other} simply kept mentioning the flue until somebody else did.',
];
const SORT_FLUE_DEFENDED = [
  '{who} said the flue was offered to everybody and that nobody else took it, which happens to be true.',
  '{who} pointed out that {they} had crawled twice before going up there. Two people agreed. One did not.',
  '{who} did not answer at all, which several people at the table found more interesting than an answer.',
];

function _sort(ctx, rng, teams, teamBoxes, searcher) {
  const beats = [];
  const scenes = [];
  const contrib = {};
  const readable = {};
  for (const t of teams) t.members.forEach(n => { contrib[n] = 0; });

  for (const t of teams) {
    let kept = 0;
    for (const name of t.members) {
      const v = noisyPair(rng, name, 'mental', 'social');
      contrib[name] = clamp01(v / 10) * 10;
      const slots = pronounSlots(name);
      if (v >= 7.2) {
        kept += 2;
        beats.push({ team: t.name, player: name, kind: 'sharp', score: v,
          text: render(freshPick(rng, SORT_SHARP), slots) });
      } else if (v <= 3.6) {
        contrib[name] = Math.max(0, contrib[name] - 1.2);
        beats.push({ team: t.name, player: name, kind: 'dull', score: v,
          text: render(freshPick(rng, SORT_DULL), slots) });
      } else {
        kept += 1;
        beats.push({ team: t.name, player: name, kind: 'steady', score: v,
          text: `${name} sorted ${slots.their} pile without drama and got most of it right.` });
      }
    }
    readable[t.name] = Math.max(0, Math.min(teamBoxes[t.name], kept));

    // THE ONE PERSON WHO COULD ACTUALLY READ THEM. Gated on the record — it
    // fires only when somebody in this team turned in a `sharp` sort — so the
    // scene is about a phase result that happened rather than about a die.
    const sharp = beats.filter(b => b.team === t.name && b.kind === 'sharp');
    if (sharp.length) {
      const star = sharp.sort((a, b) => b.score - a.score)[0].player;
      contrib[star] += 1.2;
      scenes.push(missionScene({
        id: `vault-sort-star-${t.name}`,
        eventId: 'vault-deeds-rescued-from-the-pile',
        phase: 'sort',
        participants: [star],
        behaviour: 'impressive',
        text: render(freshPick(rng, SORT_SHARP), pronounSlots(star))
          + ` ${readable[t.name]} of ${t.name}'s deeds came off that table readable, and `
          + `${star} is the reason for most of them.`,
        effects: [
          { kind: 'crowd', name: star, colour: 'impressive', mult: 1,
            source: `${star} found writing on deeds the rest of the table had binned` },
          { kind: 'reputation', player: star, axis: 'sharpness', delta: 0.6,
            source: `${star} rescued readable deeds from the discard pile` },
        ],
        confessional: {
          purpose: 'character', speaker: star,
          text: "My gran's handwriting was worse than that and I read her shopping lists for "
            + "eleven years. It's not a superpower, it's just practice nobody else has had.",
        },
      }));
    }
  }

  // THE FLUE COMES UP AT THE TABLE, and this is the scene the whole mission is
  // built to produce. It fires ONLY because a recorded phase result exists —
  // somebody left the relay — and the accuser is somebody who was on that
  // relay, so the knowledge state is `witnessed` and the speaker is entitled to
  // what they say. That is the causal chain closing: stored fact -> eligible
  // reaction -> the scene cites the fact -> the consequence cites the scene.
  const team = teams.find(t => t.members.includes(searcher));
  const pool = (team ? team.members : teams.flatMap(t => t.members)).filter(n => n !== searcher);
  if (pool.length) {
    const accuser = weightedPick(rng, pool,
      n => 0.3 + statOf(n, 'boldness') / 8 + (10 - statOf(n, 'temperament')) / 14);
    const slots = { ...pronounSlots(searcher), other: accuser };
    scenes.push(missionScene({
      id: 'vault-sort-flue-raised',
      eventId: 'vault-flue-raised-at-the-table',
      phase: 'sort',
      participants: [accuser, searcher],
      behaviour: 'suspicious',
      text: render(freshPick(rng, SORT_FLUE_RAISED), slots) + ' '
        + render(freshPick(rng, SORT_FLUE_DEFENDED), slots),
      effects: [
        { kind: 'claim', claimant: accuser, about: searcher,
          text: `${accuser} says ${searcher} left the relay while the team was a body short`,
          source: `${searcher} spent the crawl in the flue and ${accuser} was on the relay` },
        { kind: 'suspicion', observer: accuser, subject: searcher, delta: 0.3,
          source: `${searcher} broke off the crawl for the flue in front of ${accuser}` },
        { kind: 'bond', players: [accuser, searcher], delta: -0.7,
          source: `${accuser} raised the flue at the sorting table` },
      ],
      confessional: {
        purpose: 'vote-change', speaker: accuser,
        text: "We all got offered the same choice and most of us didn't take it. "
          + "I'm not calling that proof of anything. I'm saying I'll remember it on Thursday "
          + "when somebody asks me for a name.",
      },
    }));
  }

  const score = t => t.members.reduce((s, n) => s + contrib[n], 0) / Math.max(1, t.members.length);
  return {
    phase: {
      id: 'sort', name: 'The Sort',
      setting: 'A trestle table on the lawn, forty years of water-damaged deeds, and full '
        + 'daylight for the first time all afternoon.',
      stats: ['mental', 'social'],
      beats,
      readable: { ...readable },
      teams: teams.map(t => ({ name: t.name, score: clamp01(score(t) / 10),
        readable: readable[t.name] })),
    },
    contrib, scenes, readable,
  };
}

const SUMMARY = {
  triumph: [
    'Every bay held, the relay never stopped, and the trestle table came out of it stacked with deeds you could still read.',
    'They shored it properly and it paid for itself twice over. Nobody had to be pulled out of anything.',
    'The wing gave up everything it had been sitting on for forty years, and it gave it up in about two hours.',
  ],
  solid: [
    'Most of the boxes came out. One bay shut early, one person could not finish the crawl, and half the deeds were paper soup.',
    'An honest afternoon in a burnt building, worth the money and not worth a story.',
    'They got enough onto the table to be paid, and spent the sort arguing about who had been where.',
  ],
  scraped: [
    'Two readable deeds. Two, out of a wing that burned with a strongroom in it.',
    'The shoring went wrong early and everything after it went wrong for that reason.',
    'What reached the table reached it in the last twenty minutes, carried by whoever was still able to crawl.',
  ],
  failed: [
    'Nothing came out that anybody could read. The wing kept its deeds and the estate keeps its money.',
    'Bays shut, the relay stalled, and the trestle table was still empty when the host closed it.',
    'Forty years of soot on everybody, and not one page with writing on it.',
  ],
};

// ══════════════════════════════════════════════════════════════════════

export const ashVault = {
  id: 'ash-vault',
  name: 'The Ash Vault',
  teams: TEAMS,
  desc: 'The east wing burned forty years ago and has never been cleared; under the fallen '
    + 'roof there is a strongroom full of deed boxes. Working from a scaffold walkway, each '
    + 'team first shores the collapsed ceiling bay by bay with jacks and timbers, then '
    + 'crawls sixty feet on their fronts, one player at a time, dragging a deed box back out '
    + 'behind them, and finally sorts everything recovered on a trestle table on the lawn. A '
    + 'jack that looks seated and is not will close its bay for the rest of the afternoon; a '
    + 'player who stops in the crawl stops everyone behind them; and forty years of water '
    + 'means most of the deeds are illegible and only a readable one counts. One narrow '
    + 'kitchen flue leads off the crawl, and any player may leave the relay to search it for '
    + 'the housekeeper\'s ring, which is a shield for whoever finds it — but their team '
    + 'crawls a body short for as long as they are gone. Every readable deed on the table '
    + 'when the wing closes is two and a half thousand into the shared pot.',

  eligibility(ctx) {
    // A shield-granting mission stands down when the season is holding shields
    // out — the same gate the archetype Reliquary sits behind, so the "a
    // mission grants nothing but money" equivalence can hold the one immunity
    // channel out of both arms. Spec allows exactly one shield mission; this is
    // the bespoke one.
    if (ctx?.shieldsEnabled === false) return false;
    return Array.isArray(ctx?.living) && ctx.living.length >= 4;
  },

  simulate(ctx, rng) {
    const living = [...ctx.living];
    const boxes = boxesFor(living.length);
    const teams = splitTeams(living, rng, TEAMS);
    const ceremony = _ceremony(boxes);

    const shoring = _shoring(ctx, rng, teams);
    const crawl = _crawl(ctx, rng, teams, shoring.bays, boxes);
    const sort = _sort(ctx, rng, teams, crawl.teamBoxes, crawl.searcher);

    const phases = [shoring.phase, crawl.phase, sort.phase];
    // ONE SWING PER TEAM, DRAWN ONCE AND SHARED between the as-played score
    // and the as-if-present one. That is what lets the cost of the hunt be the
    // hunt and not the weather: the two numbers differ in exactly one term.
    const swings = Object.fromEntries(teams.map(t => [t.name, (rng() - 0.5) * PHASE_SWING]));
    const perfOf = (tname, crawlScore) => {
      const parts = [
        shoring.phase.teams.find(x => x.name === tname).score,
        crawlScore,
        sort.phase.teams.find(x => x.name === tname).score,
      ];
      return clamp01(parts.reduce((a, b) => a + b, 0) / parts.length + swings[tname]);
    };
    const scored = teams.map(t => ({ name: t.name, members: [...t.members],
      perf: perfOf(t.name, crawl.raw[t.name]) }));
    const asIfPerf = teams.map(t => perfOf(t.name, crawl.asIf[t.name]));

    const playerScores = {};
    for (const n of living) {
      playerScores[n] = Number(((shoring.contrib[n] || 0) + (crawl.contrib[n] || 0)
        + (sort.contrib[n] || 0)).toFixed(3));
    }

    const quality = missionQuality(scored[0].perf, scored[1].perf);
    const pay = payPot(quality);

    // WHAT THE HUNT COST, IN THE POT'S OWN CURRENCY. The same afternoon scored
    // with the searcher's hour put back in, minus the afternoon as played,
    // both through the identical arithmetic. Never negative: the searcher's
    // contribution can only raise a team's mean and the payout is monotone in
    // the blend. Positive even when they came back empty — the hour is spent
    // either way, which is what makes breaking away a gamble and not a purchase.
    const qualityAsIf = missionQuality(asIfPerf[0], asIfPerf[1]);
    const grossOf = q => Math.round(MISSION_MAX * (q < PASS_MARK ? 0 : q));
    const cost = Math.max(0, grossOf(qualityAsIf) - grossOf(quality));

    // The Shield is GRANTED by js/tr/powers.js, which owns who saw it and how
    // long it lasts. Nothing about visibility is decided here.
    const won = crawl.found ? awardShield(crawl.searcher, scored, ctx.ep, rng) : null;
    const shieldBlock = {
      searcher: crawl.searcher, found: crawl.found, cost,
      holder: won ? won.holder : null,
      witnesses: won ? [...won.witnesses] : [],
      visibility: won ? won.visibility : null,
      lines: won ? [won.seenLine] : [],
    };

    const rec = {
      id: 'ash-vault', ep: ctx.ep, name: 'The Ash Vault',
      ceremony, briefing: briefingText(ceremony.hostBeats),
      teams: scored,
      phases,
      playerScores,
      placements: placementsFrom(playerScores),
      quality, tier: pay.tier,
      bestTeam: scored[0].perf >= scored[1].perf ? scored[0].name : scored[1].name,
      potBefore: pay.potBefore, gross: pay.gross, potEarned: pay.potEarned,
      potAfter: pay.potAfter, earned: pay.potEarned,
      // The contract's own list, and `shield` beside it in the shape every
      // existing reader already knows (headless.js `_missionRecord`,
      // js/vp-tr/debug.js, js/tr/crowd.js `scoreMission`). One block, two
      // names, no second copy of the numbers.
      shields: crawl.found && won ? [shieldBlock] : [],
      shield: shieldBlock,
      sideObjectives: [],
      scenes: [...shoring.scenes, ...crawl.scenes, ...sort.scenes],
      summary: freshPick(rng, SUMMARY[pay.tier]),
      tally: { boxes, bays: { ...shoring.bays }, outOfTheCrawl: { ...crawl.teamBoxes },
        readable: { ...sort.readable } },
    };
    return validateMissionRecord(rec, ctx);
  },
};

export default ashVault;
