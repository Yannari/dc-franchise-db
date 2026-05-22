# End-of-Season Stats Export System

**Date:** 2026-05-22
**Status:** Design approved, pending implementation plan

## Problem

The DC Franchise Simulator tracks rich per-episode data (bonds, votes, alliances, advantages, romance, camp events, challenge scores, popularity) in `gs` and `episodeHistory`, but at end of season only a simplified version is extracted via the worker's `season-data-extraction` mode. Most granular data is lost. The 5 website database files (`seasonX-data.json`, `franchise_database.json`, `players_database.json`, `rankings_database.json`, `seasons_database.json`) are manually compiled via `current-season.html`.

## Solution

**Approach A: Simulator-side full export.** A new module (`js/stats-export.js`) extracts all mechanical data from `gs` at season end. The worker is simplified to narrative-only (stories, legacy, key moments). Pipeline:

1. Season ends in simulator (finale completes)
2. "Export Season Data" button in `run-ui.js` triggers extraction
3. Downloads 2 files:
   - `season{N}-raw-stats.json` — comprehensive cold stats (~80KB)
   - `season{N}-data-template.json` — pre-filled season data with `[AI_FILL]` markers for narrative fields
4. User feeds template + episode summaries to worker
5. Worker fills narrative fields only and outputs final 5 database files

## Data Model

### Per-Player Extraction

**Stats already in current schema (auto-filled instead of manual):**
- `placement` — from elimination order in `episodeHistory`
- `phase` — derived from `gs.jury[]`, `gs.finalTwo`/`finalThree`, episode of elimination
- `challengeWins` — `gs.chalRecord[name].wins`
- `immunityWins` — count of `episodeHistory[].immunityWinner === name`
- `rewardWins` — count of episode reward winners
- `idolsFound` — `gs.advantages.filter(a => a.holder === name)`
- `votesReceived` — sum from `episodeHistory[].votes[name]`
- `alliances` — `gs.namedAlliances.filter(a => a.members.includes(name))` names
- `rivalries` — derived from negative bonds (< -3) + mutual voting history

**New fields (not in current schema):**
- `votesReceivedDetail` — per-episode: `[{ep, voters: [{name, reason}], total}]`
- `votesCast` — per-episode: `[{ep, target, reason}]`
- `blindsidesReceived` — eliminated when majority of own alliance voted them out
- `blindsidesOrchestrated` — led vote against someone who didn't expect it
- `bondsFinal` — `{playerName: bondValue}` for all other players at season end
- `bondsEvolution` — `[{ep, bonds: {playerName: value}}]` per episode
- `popularityArc` — `[{ep, popularity}]` trajectory over season
- `campEventsInvolved` — all camp events where `players[]` includes this player
- `advantageLifecycle` — `[{type, foundEp, playedEp, success, votesNegated, inheritedFrom}]`
- `showmanceData` — `{partner, sparkEp, phases: [{phase, ep}], broken, breakupEp, intensity}`
- `emotionalArc` — `[{ep, state}]` from `gs.playerStates`
- `challengeScores` — `[{ep, score, placement}]` from `chalMemberScores`
- `schemesLaunched` — social manipulation events initiated (forge note, lies, etc.)
- `schemesTargeted` — social manipulation events suffered
- `chalRecord` — `{wins, podiums, bombs, appearances}` final values
- `survivalScore` — final `gs.survival[name]` morale value

### Season-Level Extraction

**Auto-computed season stats:**
- `totalTribalCouncils` — episodes with elimination
- `totalVotesCast` — sum of all voting log entries
- `totalIdolsFound` / `totalIdolsPlayed` — advantage tracking counts
- `totalBlowups` — tribal blowup event count
- `totalBlindsides` — alliance-betrayal elimination count
- `totalShowmances` / `totalBreakups` — romance counts
- `allianceTimeline` — `[{name, members, formedEp, dissolvedEp, betrayals, reason}]`
- `voteMatrix` — `{ep: {voter: target}}` for every tribal council
- `bondHeatmap` — `{playerA_playerB: finalValue}` for all pairs
- `challengeTypeBreakdown` — wins by `chalStyle` (physical, endurance, puzzle, etc.)
- `moleActivity` — `{player, sabotageCount, sabotageLog, exposedEp}` if mole was active
- `eliminationOrder` — `[{name, ep, voteCount, unanimous, blindside}]`

### Franchise Records (auto-updated)

**Challenge Records:**
- Most Challenge Wins (career + single season)
- Most Immunity Wins (career + single season)
- Most Reward Wins (career + single season)
- Highest Challenge Win Rate (`wins / appearances`)
- Most Challenge Bombs
- Best Average Challenge Score (from `chalMemberScores`)
- Most Sit-Outs

**Voting Records:**
- Most Votes Against (career + single season)
- Perfect Games (0 votes + winner)
- Most Blindsides Orchestrated
- Most Times on Wrong Side of Vote
- Longest Streak Without Receiving Votes

**Strategic Records:**
- Most Alliance Betrayals
- Longest Alliance (by episodes active)
- Most Advantages Found (career)
- Most Successful Idol Plays (votes negated)
- Most Schemes Launched (social manipulation)

**Social Records:**
- Most Jury Votes Received (single FTC)
- Highest Final Bond Average (most liked at end)
- Most Showmances
- Biggest Popularity Swing

### Season Awards (auto-computable)

| Award | Computation |
|---|---|
| Most Challenge Wins | `max(chalRecord.wins)` |
| Fan Favorite | `max(gs.popularity)` at finale |
| Best Social Game | highest avg bond at finale |
| Biggest Blindside | most unexpected elimination (alliance betrayal metric) |
| Best Villain | most schemes + lowest avg bond + deep run |
| Best Underdog | worst early challenge scores + deep run |
| Most Dramatic | most camp events + blowups + triangles |

**Narrative awards** (worker fills): Best Rivalry, Most Iconic Moment, Best Strategic Move, etc.

## Output File Schemas

### `season{N}-raw-stats.json`

```json
{
  "seasonNumber": 10,
  "castSize": 18,
  "episodeCount": 13,
  "jurySize": 9,
  "winner": "PlayerName",
  "finalists": [{"name": "...", "juryVotes": 5}, ...],
  "eliminationOrder": [...],
  "players": {
    "PlayerName": {
      "placement": 1,
      "phase": "Winner",
      "archetype": "mastermind",
      "stats": {"physical": 7, "endurance": 6, ...},
      "challengeWins": 4,
      "immunityWins": 3,
      "rewardWins": 1,
      "idolsFound": 1,
      "votesReceived": 8,
      "votesReceivedDetail": [...],
      "votesCast": [...],
      "blindsidesReceived": 0,
      "blindsidesOrchestrated": 2,
      "bondsFinal": {"OtherPlayer": 7, ...},
      "bondsEvolution": [...],
      "popularityArc": [...],
      "campEventsInvolved": [...],
      "advantageLifecycle": [...],
      "showmanceData": null,
      "emotionalArc": [...],
      "challengeScores": [...],
      "schemesLaunched": [...],
      "schemesTargeted": [...],
      "chalRecord": {"wins": 4, "podiums": 6, "bombs": 1, "appearances": 12},
      "alliances": ["The Core Four", ...],
      "rivalries": ["RivalName"]
    }
  },
  "seasonStats": {
    "totalTribalCouncils": 12,
    "totalVotesCast": 96,
    "totalIdolsFound": 3,
    "totalIdolsPlayed": 2,
    "totalBlindsides": 4,
    "totalShowmances": 1,
    "totalBreakups": 0,
    "totalBlowups": 2
  },
  "voteMatrix": {...},
  "bondHeatmap": {...},
  "allianceTimeline": [...],
  "challengeTypeBreakdown": {...},
  "moleActivity": null,
  "autoAwards": {
    "mostChallengeWins": {"player": "...", "count": 4},
    "fanFavorite": {"player": "...", "popularity": 15},
    "bestSocialGame": {"player": "...", "avgBond": 6.2},
    "biggestBlindside": {"eliminated": "...", "ep": 8, "description": "[AI_FILL]"},
    "bestVillain": {"player": "...", "schemes": 5, "description": "[AI_FILL]"},
    "bestUnderdog": {"player": "...", "description": "[AI_FILL]"},
    "mostDramatic": {"player": "...", "events": 12, "description": "[AI_FILL]"}
  }
}
```

### `season{N}-data-template.json`

Same schema as current `seasonX-data.json` but with stats pre-filled and narrative fields as `"[AI_FILL]"`:

```json
{
  "seasonNumber": 10,
  "title": "[AI_FILL]",
  "subtitle": "[AI_FILL]",
  "winner": {
    "name": "PlayerName",
    "playerSlug": "player-name",
    "vote": "5-4",
    "runnerUp": "OtherPlayer",
    "keyStats": "[AI_FILL]",
    "strategy": "[AI_FILL]",
    "legacy": "[AI_FILL]"
  },
  "placements": [
    {
      "placement": 1,
      "name": "PlayerName",
      "playerSlug": "player-name",
      "phase": "Winner",
      "notes": "[AI_FILL]",
      "strategicRank": "[AI_FILL]",
      "story": "[AI_FILL]",
      "gameplayStyle": "[AI_FILL]",
      "keyMoments": "[AI_FILL]",
      "challengeWins": 4,
      "immunityWins": 3,
      "rewardWins": 1,
      "idolsFound": 1,
      "votesReceived": 8,
      "alliances": ["The Core Four"],
      "rivalries": ["RivalName"]
    }
  ]
}
```

## Architecture

### New File: `js/stats-export.js`

Exports:
- `extractSeasonRawStats()` — builds the full raw stats JSON from `gs`
- `extractSeasonTemplate()` — builds the pre-filled template
- `computeFranchiseRecords(rawStats, existingFranchise)` — updates franchise records
- `computePlayerDatabase(rawStats, existingPlayers)` — updates player career stats
- `computeRankings(rawStats, existingRankings)` — updates ranking scores

### Integration Points

1. **`js/main.js`** — import `stats-export.js`
2. **`js/run-ui.js`** — "Export Season Data" button after finale, triggers download of both files
3. **`worker-season.js`** — new mode `"narrative-fill"` that accepts template + episode summaries, returns completed files

### Export Trigger

Button appears in run-ui.js after `gs.winner` is set (finale complete). Two downloads:
1. Raw stats JSON (for archival / future analysis)
2. Data template (for worker narrative fill)

Phase 2 (future): "Update Franchise DB" button that takes the completed season data and merges into existing franchise/player/rankings databases locally. Not part of initial implementation.

## What the Worker Changes To

### Current Worker Prompt (simplified)
"Read these episode summaries. Extract placements, count challenge wins, write stories."

### New Worker Prompt
"Here is `season10-data-template.json` with all stats pre-filled. Here are the episode summaries for narrative context. Fill in every `[AI_FILL]` field with compelling narrative. Do NOT change any numeric stats. Also output updated `franchise_database.json`, `players_database.json`, `rankings_database.json`, `seasons_database.json`."

The worker's job shrinks from "analyst + writer" to "writer only."

## Scope

**In scope:**
- `js/stats-export.js` — extraction logic
- `js/run-ui.js` — export button UI
- `js/main.js` — import
- `worker-season.js` — new `narrative-fill` mode
- Auto-computed awards and franchise records

**Out of scope:**
- Changing existing page rendering code (pages already read the JSON files)
- Mid-season analytics
- Real-time data streaming
- New website pages
