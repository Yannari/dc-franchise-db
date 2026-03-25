# Finale VP Overhaul — Design Spec

**Goal:** Replace the current 3-screen finale with a 10-screen dramatic sequence covering camp life, challenges, jury dynamics, winner ceremony, reunion show, and full season statistics with JSON export.

**Architecture:** All screens are VP renderer functions (`rpBuild*`) in `simulator.html`. Engine changes add bench selection, assistant mechanics, multi-stage final challenge, FTC swing votes, and smart decision logic. Data flows through `ep` (episode record) and `gs` (game state) — no new files.

---

## 1. Screen Flow by Format

### Jury Vote Format (traditional / fire-making / jury-cut / fan-vote)

| finaleSize | Screens |
|---|---|
| **2** | Cold Open > Finale Camp Life > FTC > Jury Vote Reveal > Winner Ceremony > Reunion > Stats |
| **3** | Cold Open > Finale Camp Life > Final Immunity > The Decision (winner picks F2) > The Benches > FTC > Jury Vote Reveal > Winner Ceremony > Reunion > Stats |
| **4** | Cold Open > Finale Camp Life > Final Immunity > The Decision (winner cuts 1, top 3 to FTC) > The Benches > FTC > Jury Vote Reveal > Winner Ceremony > Reunion > Stats |

Max going to FTC is always 3. The Decision immunity winner picks strategically (jury vote projection), not randomly.

**Note — finaleSize=2:** The immunity challenge still runs in the engine (determines who holds power for jury-cut format and fire-making), but is NOT shown as a separate VP screen. For finaleSize=2, both finalists go straight to FTC.

**Note — finaleSize=4:** Requires a new engine branch in `simulateFinale()` mirroring the finaleSize=2 branch but cutting from 4 to 3. Immunity winner picks who to cut; remaining 3 go to FTC.

**Note — fire-making format:** Follows the same flow as traditional. The fire-making twist fires within the existing engine logic after the Decision (already implemented).

**Note — fan-vote format:** Follows the same flow as traditional but replaces jury vote with fan vote (popularity-based). Uses the same VP screens.

### Final Challenge Format (no jury)

| finaleSize | Screens |
|---|---|
| **2 / 3 / 4** | Cold Open > Finale Camp Life > The Benches > Final Challenge (with optional assistants) > Winner Ceremony > Reunion > Stats |

No immunity challenge, no decision, no FTC. The final challenge determines the winner directly.

**Note — finaleSize=2:** Only 2 finalists. Benches are a binary choice (pick a side). This is intentional — even with only 2 options, the bench walk reveals allegiances and creates drama.

### Condition Summary

| Screen | Condition |
|---|---|
| Cold Open | always (existing `rpBuildColdOpen`) |
| Finale Camp Life | always (new `rpBuildFinaleCampLife`) |
| Final Immunity Challenge | jury format + finaleSize >= 3 (existing `rpBuildFinaleChallenge`, enhanced) |
| The Decision | jury format + finaleSize >= 3 (existing `rpBuildFinalCut`, enhanced with smart logic) |
| The Benches | whenever there is ANY challenge in the finale (new `rpBuildBenches`) |
| FTC | jury format only (existing `rpBuildFTC`, major overhaul) |
| Jury Vote Reveal | jury format only (existing `rpBuildJuryVoteReveal`, minor enhance) |
| Final Challenge | final-challenge format only (new `rpBuildFinaleGrandChallenge`) |
| Winner Ceremony | always (new `rpBuildWinnerCeremony`) |
| Reunion Show | always (new `rpBuildReunion`) |
| Season Statistics | always (new `rpBuildSeasonStats`) |

**Note — Fan Favorite:** The existing standalone `rpBuildFanFavorite` screen is absorbed into the Reunion Show awards section. Remove from screen assembly.

**Note — Backward compatibility:** All new `rpBuild*` functions must handle missing data from pre-overhaul saves gracefully (return null or show fallback content). Check `ep.benchAssignments`, `ep.finaleChallengeStages`, `ep.ftcSwings` etc. before rendering.

---

## 2. Screen Details

### Screen 1: Cold Open
Existing `rpBuildColdOpen`. Final cast status grid. No changes needed.

### Screen 2: Finale Camp Life

**Tone:** Golden hour (`tod-golden`). Solemn, reflective. Last morning.

**New function:** `rpBuildFinaleCampLife(ep)`

**Content:**
- **Season journey confessionals** per finalist. Generated from their stats, alliances, rivalries, challenge record, elimination history. References specific game moments, not generic quotes. Example: "I came into this game as an underdog on Blue. Nobody gave me a chance. Then I won immunity at F7 and everything changed."
- **Relationships recap** per finalist. Who they're close to, who they burned, unfinished business.
- **What's at stake** per finalist. Their path to victory / what they need to happen.
- **Final morning moments** atmospheric events: staring at the fire, walking the beach, packing their bag, looking at the empty spots where eliminated players used to sleep.

### Screen 3: Final Immunity Challenge

**Condition:** Jury format + finaleSize >= 3.

**Existing function:** `rpBuildFinaleChallenge(ep)` — enhanced with:
- Pre-challenge confessionals from each finalist about needing this win.
- Jury bench reaction after winner revealed: "The jury watches. Some smile. Some don't."
- Challenge type label + description.
- Keep existing interactive placement reveal.

### Screen 4: The Decision

**Condition:** Jury format + finaleSize >= 3.

**Existing function:** `rpBuildFinalCut(ep)` — enhanced with smart decision logic.

**Logic — NOT randomized:**
The immunity winner picks who to cut based on jury vote projection:
- For each possible F2/F3 combination, simulate who the jury would vote for (using current pre-FTC bonds).
- The immunity winner keeps the opponent(s) they're most likely to beat.
- Factor in: bond with potential partner, loyalty stat (high loyalty leans toward allies), strategic stat (high strategic leans toward beatable opponents).

**Note — timing vs. FTC swing votes:** The Decision uses pre-FTC bonds for projection. This is intentional — the immunity winner cannot predict FTC performance. Swing votes during FTC may invalidate their projection, creating dramatic irony (e.g., the player they kept to beat actually performs well at FTC and wins).

**Content:**
- Immunity winner's internal monologue weighing options. References specific relationships and jury math.
- The reasoning shown: loyalty vs. strategy vs. jury sentiment.
- Cut player gets a finale-specific elimination card with last words.
- Store reasoning in `ep.finalCut.reasoning`.

### Screen 5: The Benches

**Condition:** Whenever there's ANY challenge in the finale (both formats).

**New function:** `rpBuildBenches(ep)`

**Player pool:**
- Jury format: `gs.jury` members sit on benches (they are present at the finale).
- Final-challenge format: all `gs.eliminated` players sit on benches (no formal jury, everyone returns for the final spectacle).

**Mechanic:**
- Each player chooses a finalist's bench based on highest bond with that finalist. If bonds are within 0.5, factor in who voted them out (avoid that finalist's bench).
- Store bench assignments: `ep.benchAssignments = { [finalistName]: [supporter1, supporter2, ...] }`.
- Store reasons: `ep.benchReasons = { [supporter]: { finalist, reason } }`.

**VP — Interactive reveal:**
- Card-by-card reveal (same `tvRevealNext` pattern). Each player appears, walks to a bench.
- Short reason shown per player: references their relationship with the finalist.
- Drama moments when someone sits unexpectedly (former ally choosing rival's bench). Special card: "The jury gasps. [Player] sits with [Finalist]. [Other finalist] looks away."
- Live tally showing supporter count per finalist (reuse `tv-tally-*` pattern).
- Skip to results button.

**For final-challenge format — Assistant Selection:**
Only when `seasonConfig.finaleAssistants === true`.
After bench reveal, each finalist picks an assistant from their bench:
- **Loyal/nice archetypes** (loyal-soldier, social-butterfly, underdog, temperament >= 6): pick highest bond supporter from bench (heart choice).
- **Strategic/schemer archetypes** (mastermind, schemer, strategic >= 7): pick highest challenge-stat supporter from bench (smart choice).
- **Others:** weighted blend 60% stats / 40% bond. If best stat pick has bond <= -1, downgrade (backfire risk).
- **Empty bench:** finalist goes solo. Dramatic moment: "[Finalist] looks at the empty bench. Nobody came. They're on their own."
- **Sabotage chance:** if assistant has bond <= -2 with finalist, `15% + abs(bond) * 2%` chance stats contribute negatively instead of positively. "[Assistant] drops the rope. Was it an accident? [Finalist] doesn't think so."
- Store: `ep.assistants = { [finalist]: { name, stats, bond, sabotage } }`.

### Screen 6a: FTC (Final Tribal Council) — Jury Format Only

**Tone:** Deep night (`tod-deepnight`). Fire. Most dramatic screen in the app.

**Existing function:** `rpBuildFTC(ep)` — major overhaul. Current version has basic opening statements and Q&A. New version has 5 phases with swing vote mechanics.

**Phase 1: The Walk In**
- Finalists enter. Jury seated. Atmospheric text.
- Each finalist's portrait with record: immunity wins, idols played, votes survived, key alliance.

**Phase 2: Opening Statements**
- Each finalist delivers a speech generated from actual game data. References specific moves, alliances, betrayals.
- Archetype-flavored delivery: masterminds sell chess game, social butterflies sell relationships, underdogs sell survival arc, challenge beasts sell dominance.

**Phase 3: Jury Q&A**
- Each juror gets a question directed at one finalist. Generated from actual relationship:
  - **Bitter juror** (bond <= -2, voted out by finalist): trap question / accusation. "You told me I was safe. Explain."
  - **Respectful juror** (bond >= 2): genuine question. "What was the hardest decision you made?"
  - **Strategic juror** (strategic >= 7): game analysis question. "Walk me through why you cut [ally] at F7."
  - **Emotional juror** (social >= 7, temperament <= 4): raw question. "Did you ever actually care about me or was it all game?"
- **Finalist responses** based on stats: high social = composed, low temperament = defensive, high strategic = analytical.
- **Good/bad answer determination:** compare finalist's `social + strategic` vs. juror's question difficulty (based on juror's strategic stat + bitterness). Higher finalist score = good answer. Affects swing votes.
- **Jury reactions** after each answer: nods, eye rolls, whispers, laughter. Based on whether the answer helped or hurt.

**Phase 4: Fireworks Moments**
- **Feuds:** bond <= -3 between juror and finalist = Q&A escalates into confrontation. Back-and-forth exchange.
- **Trap questions:** juror forces finalist to admit a betrayal or lie. "Did you know about the vote before it happened?"
- **Mockery:** if finalist projected 0 votes, a juror roasts their game. "You're sitting here because [other finalist] chose to bring you. That's not a game. That's a ride."
- **Laughter:** high boldness or social finalist gets a funny moment. Breaks tension.
- **Unexpected respect:** bitter juror surprises everyone with a compliment. "I can't stand you. But you played the best game. I'll give you that."
- **Supporting moments:** close ally juror stands up for the finalist. "I watched [finalist] play every single day. Nobody worked harder. Nobody. I just want you all to know that before you vote." Can sway hesitating jurors.

**FTC Swing Vote Mechanic:**
- Hesitating jurors: bond between -0.5 and 1.5 with multiple finalists.
- Good answer from a finalist = bond nudge (+0.3 to +0.5) toward that finalist for hesitating jurors.
- Bad answer = bond nudge away (-0.3 to -0.5).
- Supporting moments from ally jurors = additional nudge (+0.2) for hesitating jurors.
- Bond nudges use the existing symmetric `addBond()` function.
- The final jury vote uses post-FTC bonds, not pre-FTC.
- Store: `ep.ftcSwings = [{ juror, originalVote, finalVote, reason }]`.

**Phase 5: Final Plea**
- Each finalist gets a closing statement. One last pitch. Generated from their strongest argument (most wins? most loyal? most strategic?).

### Screen 6b: Final Challenge — Final-Challenge Format Only

**Tone:** Arena (`tod-arena`). Grandiose. Unique multi-stage challenge.

**New function:** `rpBuildFinaleGrandChallenge(ep)`

**Not a recycled challenge.** A unique 3-stage finale challenge:

1. **Endurance Stage** (endurance + mental) — holding on, outlasting. Assistant helps (their endurance adds as % boost to score). Narration, confessionals from bench supporters reacting.
2. **Physical Stage** (physical + endurance) — obstacle course, sprint, climb. Assistant helps (their physical adds as % boost). More narration, tension building.
3. **Puzzle/Mental Stage** (mental + strategic) — final puzzle lock. **Solo only** — assistant drops off before this stage. "From here, you're on your own."

- Each finalist accumulates score across stages. Winner = highest combined.
- Assistant contributes their stats as a percentage boost in stages 1-2 only.
- Sabotage: if triggered (bond-based probability), assistant's contribution becomes negative for one stage.
- **Narration between stages** — confessionals from bench supporters, drama from the benches. Focus is absolutely on the finalists; helpers appear but don't dominate.
- Finalists cannot use confessionals during the challenge (they're competing). Bench supporters and helpers can.
- Store: `ep.finaleChallengeStages`, `ep.finaleChallengeScores`, `ep.finaleChallengeWinner`.

### Screen 7: The Result

**Jury format:** Existing `rpBuildJuryVoteReveal(ep)` — interactive card-by-card pattern. Enhanced: after all votes revealed, pause beat before winner announcement. If `ep.ftcSwings` has entries, show "FTC changed X votes" callout.

**Final challenge format:** New `rpBuildFinalChallengeResult(ep)` — stage-by-stage score reveal. Show each stage's scores, running total, then final winner. Interactive reveal (stage by stage with a "Next Stage" button + skip).

### Screen 8: Winner Ceremony

**Tone:** Gold explosion (`tod-golden`). CSS confetti particle burst. Gold/accent colors.

**New function:** `rpBuildWinnerCeremony(ep)`

**Content:**
- **Pause beat:** "The winner of [Season Name]..."
- **Winner announcement:** portrait goes XL, gold border, display font name.
- **Confetti animation:** CSS keyframe particle burst (new `@keyframes confetti-fall` with randomized colored squares).
- **Trophy moment:** "The tribe has spoken. [Winner] is the Sole Survivor."
- **Winner's final confessional:** generated from full game arc. Specific, not generic. References their journey from start to finish.
- **Runner-up reaction:** gracious or bitter depending on bond with winner.
- **Bench eruption** (final challenge format): winner's supporters celebrate, losing side reacts.
- **Assistant callout** (if contributed significantly): "[Assistant] helped [Winner] when it mattered most."

### Screen 9: Reunion Show

**Tone:** Stage lights. Bright. Talk-show energy.

**New function:** `rpBuildReunion(ep)`

**Interactive reveal** — each section revealed one by one with "Next" button + "Skip to results." Uses a dedicated `_reunionState[epNum]` similar to `_tvState` for tracking reveal progress.

**Sections:**

1. **Season in Numbers** — quick stats banner: episodes played, total votes cast, idols found, blindsides, ties, rock draws, advantages played. Computed by scanning `gs.episodeHistory`.

2. **The Season Story** — 3-4 key narrative moments auto-detected from episode history. Detection logic:
   - **Biggest blindside:** player with highest strategic rank eliminated earliest.
   - **Closest vote:** episode with smallest margin between top 2 vote-getters.
   - **Most dramatic idol play:** idol play that negated the most votes.
   - **Biggest betrayal:** alliance member who voted out their own ally with highest prior bond.
   Each gets a card with episode number, players involved, one-line dramatic recap.

3. **Awards Ceremony** — revealed one by one:
   - **Best Strategic** (full ranking, all players) — computed from: `pStats(name).strategic` weighted by placement (deeper = more weight) + advantages found/played + votes controlled (episodes where their target was eliminated).
   - **Best Physical** (most challenge wins) — from `gs.chalRecord[name].wins`. Full sorted list.
   - **Best Social** (highest average bond at time of elimination) — scan episode snapshots for each player's average bond when they left.
   - **Best Defensive** (survived most votes / least votes received relative to placement) — `totalVotesReceived / placementRank` ratio, lower is better.
   - **Biggest Villain** (lowest average bond + most betrayals) — scan `gs.episodeHistory` for betrayal events + compute average bond across all players.
   - **Most Chaotic** (alliance switches + boldness) — count how many different alliances a player was in across episodes + `pStats(name).boldness`.
   - **Most Unlucky** (idoled out, rock drawn, twist victim) — scan elimination causes from episode history.
   - **Tragic Exit** (highest strategic potential, lowest placement) — `pStats(name).strategic / placementRank`.
   - **Fan Favorite** (if popularity enabled) — from `gs.popularity`. Absorbs the old standalone Fan Favorite screen.
   - **Best Duo / Showmance** (highest mutual bond pair) — scan all player pairs, find highest `getBond(a,b)` where both played in the season.

4. **Drama Highlights** — auto-detected from episode history: tribal blowups (`ep.tribalBlowup`), social bombs (`ep.socialBombs`), betrayal events, idol misplays (`ep.idolMisplays`). Each gets a card.

5. **Player Superlatives** — fun quick-fire generated from stats:
   - "Most likely to return" — highest `strategic + social + boldness` among non-winners.
   - "Most robbed" — eliminated player with highest threat score at elimination.
   - "Best last words" — pull the best `vpGenerateQuote` from elimination episodes.
   - "Quietest game" — lowest total votes received + fewest camp events.

6. **Final Standings Recap** — all players in placement order with portrait, placement, phase tag, and one-line note (how they were eliminated).

### Screen 10: Season Statistics

**Tone:** Clean, dark, data-focused.

**New function:** `rpBuildSeasonStats(ep)`

**Sections:**
1. **Season Metadata** — name, winner, final vote, fan favorite, cast size, episode count, jury size.
2. **Full Placement Table** — Place | Player (portrait) | Phase (Winner/Finalist/Juror/Pre-Juror) | Notes (vote count at elimination, signature move/moment).
3. **Challenge Performance** — immunity wins, reward wins, total wins (full sorted lists, all players with at least 1 win).
4. **Votes Received Against** — all players sorted by total votes received, with count. Computed by scanning all `ep.votingLog` entries across episodes.
5. **Advantages & Idols** — found, played, robbed/stolen. From `ep.idolFinds`, `ep.idolPlays`, advantage events.
6. **Full Strategic Rankings** — all players 1 to N, not truncated. Computed same as Reunion Best Strategic award.
7. **Detailed Accolades** — same awards from Reunion with stat justification (e.g., "Best Physical: Chase — 3 wins, 2 immunities").
8. **Key Narrative Moments** — top 4-5 season-defining moments (same detection as Reunion Season Story).
9. **Copy JSON button** — generates a `season_data.json` matching the exact `season9-data.json` structure. Copies to clipboard.

**JSON structure:** `seasonNumber`, `title`, `subtitle`, `castSize`, `episodeCount`, `jurySize`, `winner` (with `name`, `playerSlug`, `vote`, `runnerUp`, `keyStats`, `strategy`, `legacy`), `finalists`, `placements` array (each with `placement`, `name`, `playerSlug`, `phase`, `notes`, `strategicRank`, `story`, `gameplayStyle`, `keyMoments`, `immunityWins`, `rewardWins`, `challengeWins`, `idolsFound`, `votesReceived`, `alliances`, `rivalries`).

**Note — `story` and `keyMoments` generation:** These narrative fields are auto-generated by scanning episode history for each player. `story` summarizes their arc (tribe assignment, key alliances, pivotal votes, elimination method). `keyMoments` lists their most notable episode events. Won't be as literary as hand-written versions but will be factually accurate.

---

## 3. New Engine Mechanics

### Bench Selection (`generateBenchAssignments`)
- Called during `runFinale()` when there's a challenge (jury format + finaleSize >= 3, or final-challenge format).
- Player pool: `gs.jury` for jury formats, `gs.eliminated` for final-challenge format.
- Each player picks a finalist bench: highest bond. Tiebreak: avoid finalist who voted them out.
- Stored in `ep.benchAssignments = { [finalist]: [supporter1, supporter2, ...] }`.
- Also stores `ep.benchReasons = { [supporter]: { finalist, reason } }`.

### Assistant Selection (`selectAssistant`)
- Called after bench assignments, final-challenge format only, when `seasonConfig.finaleAssistants === true`.
- Logic: archetype-driven (heart vs. smart choice) with bond guard.
- Stored in `ep.assistants = { [finalist]: { name, stats, bond, sabotage } }`.

### Multi-Stage Final Challenge (`simulateFinaleChallenge`)
- Replaces the current single `simulateIndividualChallenge` call for final-challenge format.
- 3 stages with different stat weights. Assistant boosts stages 1-2 as percentage of their relevant stat.
- Sabotage roll: `15% + abs(bond) * 2%` chance per stage where assistant contributes (bond <= -2 only).
- Returns per-stage scores + overall winner.
- Stored in `ep.finaleChallengeStages`, `ep.finaleChallengeScores`, `ep.finaleChallengeWinner`.

### FTC Swing Votes
- During `generateFTCData`, identify hesitating jurors (bond -0.5 to 1.5 with 2+ finalists).
- Simulate Q&A quality: finalist's `social + strategic` vs. juror's question difficulty (`juror.strategic + bitterness_factor`).
- Good/bad answers nudge hesitating juror bonds via `addBond()` (symmetric).
- Supporting moments from ally jurors provide additional nudge.
- Final jury vote uses post-FTC adjusted bonds.
- Stored in `ep.ftcSwings = [{ juror, originalVote, finalVote, reason }]`.

### Smart Decision Logic
- During `runFinale()`, when immunity winner must cut someone (finaleSize >= 3):
- For each possible combination, project jury votes using current pre-FTC bonds.
- Pick the combination where the immunity winner has the best projected vote margin.
- Weight by: loyalty stat (high = lean toward keeping allies), strategic stat (high = lean toward beatable opponents).
- **Note:** Uses pre-FTC bonds intentionally. The immunity winner cannot predict FTC performance. Swing votes may invalidate their projection, creating dramatic irony.
- Store reasoning in `ep.finalCut.reasoning`.

### finaleSize=4 Engine Branch
- New branch in `simulateFinale()` for when `cfg.finaleSize === 4`:
- Run final immunity challenge among 4 players.
- Immunity winner uses Smart Decision Logic to cut 1 player (4 → 3).
- Remaining 3 go to FTC (or all 4 go to final challenge if final-challenge format, no cut needed).
- Cut player gets elimination card + joins jury.

---

## 4. New Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| `finaleAssistants` | boolean | false | Enable assistant selection for final challenge format |

No other new settings needed. `finaleSize` and `finaleFormat` already exist.

---

## 5. Data Dependencies

All data needed is already available in `gs` and episode history:
- Bond data: `getBond(a, b)`, `addBond(a, b, delta)`
- Player stats: `pStats(name)`
- Player info: `players.find(p => p.name === name)` for archetype, slug
- Elimination history: `gs.episodeHistory` (each entry has `votingLog`, `alliances`, `idolPlays`, `socialBombs`, `tribalBlowup`, `chalPlacements`, etc.)
- Challenge records: `gs.chalRecord[name]` (wins, podiums, bombs)
- Alliance history: from episode `alliances` arrays
- Advantages: `gs.advantages` + episode `idolPlays` / `idolFinds`
- Popularity: `gs.popularity` (if enabled)
- Pronouns: `pronouns(name)`

**Note:** `ep` in VP screen builders refers to the episode history record (which includes `gsSnapshot`), not the raw engine `ep` object. New `rpBuild*` functions follow this existing pattern.

**Note — Reunion/Stats aggregation:** Awards like Best Defensive, Most Chaotic, Most Unlucky require scanning all episode history entries to aggregate per-player data. This computation happens at render time in the `rpBuild*` function, not precomputed during simulation. Performance is fine since episode history is small (< 20 entries).

No external API calls. No new data stores. Everything generates from existing game state.
