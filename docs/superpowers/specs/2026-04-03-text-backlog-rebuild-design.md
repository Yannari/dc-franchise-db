# Text Backlog Rebuild — Design Spec

**Date:** 2026-04-03

## Overview

Rewrite `generateSummaryText(ep)` so every VP screen has a text equivalent, formatted as an AI writer's script. The text backlog becomes the single source of episode narrative — VP content as backbone, writer context extras at the end. No more parallel rendering logic that drifts from the VP.

## Principles

1. **Every VP screen gets a text section.** If `vpScreens.push` exists for it, the text backlog has a `=== SECTION ===` for it.
2. **Read from the same `ep` data the VP reads.** No calling rpBuild functions and stripping HTML. Each section has its own small text formatter that reads `ep` fields directly.
3. **Skip sections with no data.** No reward challenge = no reward challenge section. No RI = no RI section.
4. **Plain text, no HTML.** Strip any HTML that leaks from shared helpers (like `getTribeAdvantageStatus`).
5. **AI writer script format.** Reads like an episode unfolding — meta context first, then chronological VP order, then writer extras.

## Section Order

### Header Block (context for the AI writer)

```
=== META ===
Season: [name] | Episode: [num] | Phase: [phase] | Players Remaining: [count]

=== CAST ===
STARTING CAST ([count]): [names]
TRIBES:
  [TRIBE NAME] ([count]): [members]
ELIMINATED: [names]
ON REDEMPTION ISLAND: [names] (if applicable)
ON EXILE: [name] (if applicable)
```

### Episode Flow (VP screen order)

Each section below maps 1:1 to a VP screen. Only rendered if the VP screen would render (data exists).

```
=== COLD OPEN ===
Episode hook, fan pulse rankings, "coming in from last episode" context.
Source: ep.coldOpenHook, gs.popularity, ep.gsSnapshot

=== RETURNS === (RI re-entry or rescue return)
Who returned, from where, challenge result if applicable.
Source: ep.riReturn, ep.rescueReturnChallenge

=== MERGE ===
Merge announcement, new tribe name, merged members.
Source: ep.isMerge, gs.mergeName

=== CAMP — PRE-CHALLENGE ===
Per tribe:
  - Advantage status (idols hidden, who holds what)
  - Food/survival levels
  - Camp events (pre phase) with badges
  - Alliance status (formed, cracking, dissolved)
  - Relationship highlights (bonds, tensions, hostility)
Source: ep.campEvents[tribe].pre, ep.advantagesPreTribal, gs.survival, gs.namedAlliances

=== REWARD CHALLENGE ===
Challenge name, type, description.
Placements per tribe, standout/weak link.
Reward item, winner.
Reward sharing (if applicable).
Source: ep.rewardChalData

=== IMMUNITY CHALLENGE ===
Challenge name, type, description.
Winner/loser tribe (pre-merge) or individual placements (post-merge).
Standout/weak link, sit-outs.
Source: ep.challengeLabel, ep.challengeCategory, ep.challengePlacements

=== TWISTS ===
All twist scenes in order. Each twist gets its own sub-block:
  - Journey (travelers, outcomes, advantages won/votes lost)
  - Kidnapping (who, from where, to where)
  - Shared immunity, double safety, hero duel, guardian angel
  - Spirit island
  - Sudden death
  - Any other twist from generateTwistScenes
Source: ep.twists, ep.journey, generateTwistScenes(ep) data

=== EXILE ISLAND ===
Who was exiled, by whom (tribe decision or immunity winner pick), reasoning.
What they found (or nothing).
Whether they return for tribal (format) or skip tribal (twist).
Survival drain if applicable.
Source: ep.exileFormatData or ep.twists[exile-island]

=== CAMP — POST-CHALLENGE ===
Per tribe: camp events (post phase).
Source: ep.campEvents[tribe].post

=== VOTING PLANS ===
Per alliance: target, reasoning, members, spearheader.
Split votes if applicable.
Conflicted players and why.
Independent voters.
Going into tribal: primary target, counter target.
Advantages in play that could affect the vote.
Key confessionals.
Source: ep.alliances, ep.votingLog, ep.immunityWinner, gs.advantages

=== TRIBAL COUNCIL ===
Attendees, emotional states.
Advantages being considered (SITD, idols).
Word at camp (targets #1, #2, #3).
Tribal dialogue (host questions, player responses, reactions).
Source: ep.tribalDialogue, ep.tribalPlayers

=== THE VOTES ===
Advantage plays (idols, SITD, sole vote, vote block, vote steal, extra vote, safety without power, team swap).
Full vote log: each voter, who they voted for, and why.
Black vote if applicable.
Live tally, final tally.
Tiebreaker if applicable (revote, rocks, challenge).
Elimination: who, archetype, exit quote.
Source: ep.idolPlays, ep.votingLog, ep.votes, ep.eliminated, ep.shotInDark, ep.tiebreakerResult

=== WHY THIS VOTE HAPPENED ===
Strategic analysis of the elimination (kept from current text — VP doesn't have this).
Primary reason, vote breakdown, betrayals, protectors, advantages impact.
Source: vpWhyBullets data or inline analysis from ep data

=== SLASHER NIGHT === (replaces challenge + tribal when active)
Announcement, round-by-round progression, showdown, results, aftermath.
Source: ep.slasherRounds, ep.slasherResult

=== AMBASSADORS ===
Selected ambassadors, negotiation, who gets eliminated.
Source: ep.ambassadors

=== RI DUEL / RESCUE ISLAND ===
Duel matchup, challenge type, winner/loser.
Rescue island life events (bonding, rivalry, quit temptation).
Source: ep.riDuel, ep.rescueIslandEvents

=== JURY LIFE ===
Jury members reflecting, reacting to the game from outside.
Source: ep.juryLife

=== CAMP OVERVIEW ===
Current advantages in play (who holds what).
Fan pulse rankings.
Source: gs.advantages, gs.popularity

=== AFTERMATH ===
Power shifts (gained ground, lost ground, rising, fading).
Threads to watch.
Source: ep.aftermath or derived from vote results + alliance state
```

### Finale Screens (only during finale episode)

```
=== GRAND CHALLENGE ===
Final immunity challenge, placements.
Source: ep.grandChallenge

=== FINAL CUT ===
Fire-making or jury cut decision.
Source: ep.fireMaking, ep.finalCut

=== FTC Q&A ===
Final tribal council speeches, jury questions.
Source: ep.ftcQuestions

=== JURY CONVENES ===
Jury deliberation, vote projections.
Source: ep.juryConvenes

=== JURY VOTES ===
Individual jury votes with reasoning.
Source: ep.juryVotes

=== FAN CAMPAIGN === (fan vote finale only)
Fan campaign events.
Source: ep.fanCampaign

=== FAN VOTE === (fan vote finale only)
Fan vote results, save/elimination.
Source: ep.fanVoteResult

=== WINNER CEREMONY ===
Winner announced, final vote count.
Source: ep.winner, ep.finaleResult

=== REUNION ===
Post-game reflections, awards.
Source: ep.reunion

=== SEASON STATS ===
Season-wide statistics, records.
Source: ep.seasonStats
```

### Writer Extras (appended at end)

```
=== WRITER CONTEXT ===
ONGOING STORYLINES: narrative threads still developing
STOLEN CREDIT: if a bold player stole credit this episode
FAKE IDOL: if a fake idol was planted/played
CHALLENGE THROWS: if anyone threw a challenge
BLACK VOTE CAST: new black votes created this episode
COLD OPEN HOOK: suggested opening for next episode
NEXT EPISODE QUESTIONS: cliffhanger hooks for the writer
```

## Implementation Approach

Replace the current `generateSummaryText` (~430 lines) with a new version structured as:

```javascript
function generateSummaryText(ep) {
  const L = [];
  const ln = s => L.push(s);
  const sec = t => { ln(''); ln(`=== ${t} ===`); };
  const stripHtml = s => s.replace(/<[^>]+>/g, '');

  // Header block
  _textMeta(ep, ln, sec);
  _textCast(ep, ln, sec);

  // Episode flow — VP screen order
  _textColdOpen(ep, ln, sec);
  _textReturns(ep, ln, sec);
  _textMerge(ep, ln, sec);
  _textCampPre(ep, ln, sec);
  _textRewardChallenge(ep, ln, sec);
  _textImmunityChallenge(ep, ln, sec);
  _textTwists(ep, ln, sec);
  _textExile(ep, ln, sec);
  _textCampPost(ep, ln, sec);
  _textVotingPlans(ep, ln, sec);
  _textTribalCouncil(ep, ln, sec);
  _textTheVotes(ep, ln, sec);
  _textWhyVote(ep, ln, sec);
  _textSlasherNight(ep, ln, sec);
  _textAmbassadors(ep, ln, sec);
  _textRIDuel(ep, ln, sec);
  _textJuryLife(ep, ln, sec);
  _textCampOverview(ep, ln, sec);
  _textAftermath(ep, ln, sec);

  // Finale screens
  _textGrandChallenge(ep, ln, sec);
  _textFinalCut(ep, ln, sec);
  _textFTCQA(ep, ln, sec);
  _textJuryConvenes(ep, ln, sec);
  _textJuryVotes(ep, ln, sec);
  _textFanCampaign(ep, ln, sec);
  _textFanVote(ep, ln, sec);
  _textWinnerCeremony(ep, ln, sec);
  _textReunion(ep, ln, sec);
  _textSeasonStats(ep, ln, sec);

  // Writer extras
  _textWriterContext(ep, ln, sec);

  return L.join('\n');
}
```

Each `_text*` function is a small formatter (10-40 lines) that:
- Checks if data exists → returns early if not
- Reads from `ep` fields (same ones the VP reads)
- Outputs plain text via `ln()` and `sec()`

## What Gets Removed

- The current 430-line `generateSummaryText` monolith
- Duplicate camp events section (CAMP EVENTS + CAMP EVENTS FULL)
- Separate CURRENT GAME STATUS (covered by CAST header)
- Separate ADVANTAGES IN PLAY (covered by camp overview)
- Separate VOTED OUT THIS EPISODE (covered by THE VOTES)
- Separate NAMED ALLIANCES (covered by camp pre-challenge)

## What Gets Added

- Merge announcement text
- Exile island scene text (format + twist)
- Aftermath text (power shifts, threads to watch)
- Camp overview text (fan pulse)
- Full slasher night progression
- All twist scene types (kidnapping, shared immunity, etc.)
- Jury life text
- All finale screens (grand challenge, final cut, jury votes, winner, reunion, stats)

## Scope

This is a large rewrite but each formatter is independent and small. Can be implemented in batches:
1. Header + core flow (meta, cast, camp, challenge, votes) — replaces the bulk
2. Twist/exile/special episode formatters
3. Finale formatters
4. Writer extras
