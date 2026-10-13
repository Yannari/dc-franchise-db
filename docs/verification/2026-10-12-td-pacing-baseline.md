# TD director pacing baseline — 2026-10-12

Stage 1 is complete. This change adds an audit runner and evidence; it changes no shipping simulation or dialogue. The measured source revision is 0c211794.

An 18-scene soft target is plausible to test against this baseline; these measurements do not establish that enforcing it improves quality. The reads do not support padding every quiet day to 18. The stronger editing opportunities are repeated information, dialogue density, and consecutive vote scenes. Keep the proposed order: safe proposals/commits, shared selection, rolling exposure/freshness, then rhythm. Leave conflict frequency unchanged for the comparison.

## Results

Forty settings/seed combinations produced **840 camp-days and 14,480 aired camp scenes**. Each was also run without instrumentation. All 40 matched on episode-history, bonds and story-state hashes, RNG call count and winner. This proves the observer preserved these outputs in this matrix, not that every future configuration is covered.

| Per camp-day | Median | 90th percentile | Range |
|---|---:|---:|---:|
| Aired scenes | 17 | 22 | 7–26 |
| Spoken dialogue turns | 90 | 124 | 26–166 |
| Confessional turns | 20 | 27 | 6–40 |
| Longest consecutive heavy-tagged run | 5 | 8 | 0–11 |

Only **6/840 days (0.7%) exceed 22 scenes**. Scene count excludes the challenge, ceremony, recap and off-camera backlog. These are camp pacing measurements, not whole-episode running times. A turn is one structured say/conf entry, not a sentence, word count or estimated duration.

Largest contributions: vote 3,479 scenes (24.0%), kit 2,296 (15.9%), deep confessionals 1,074 (7.4%), quick cuts 966 (6.7%), openers 795 (5.5%). Every system's count is in [summary.json](../superpowers/audits/2026-10-12-td-pacing/summary.json).

**Fresh central pairings:** 2,647/12,011 pair scenes (22.0%); excluding episode one, 1,919/10,770 (17.8%). A fresh pairing is its first aired central conversation in that season. These figures do not prescribe a quota; many repeated pairings are worthwhile development.

**Rolling concentration:** the largest person share is Bruno's 31.6% of spoken-plus-confessional turns over episodes 13–15 of world-tour_enabled_coaches_1729. Bruno/Millie take 28.6% of central-pair scenes in that same window, which has six distinct speakers. Small late casts naturally concentrate airtime. Restricting windows to episodes 1–7, the peaks are Leshawna at 15.6% (carnival_enabled_no-coaches_2026, episodes 5–7) and Aubrey/Julia at 17.6% (world-tour_disabled_no-coaches_1729, episodes 1–3). Person and pair denominators differ; neither is a percentage of all possible interactions.

**Continuation attempts:** 135 follow-ups, 155 turns and 137 witness morning-afters aired. Another 13 witness attempts returned no scene. There were no ambiguous attempt-to-scene matches in this matrix. Every observed continuation that was constructed aired: this baseline does not demonstrate that these payoffs are currently being constructed and then lost. Their eager state mutations remain a risk when the future shared budget starts rejecting them.

**Romance selection:** with romance enabled, 118 raw romance events aired. The observed alternatives were 113 local-person-cap cuts, 60 main-cap cuts, 51 events outside the main pool, 12 selected but not rendered, 9 same-storyline cuts, 5 day-one filters and 4 constructed scenes subsequently cut. These are engine-event categories; director-added romance scenes are separate. With romance disabled, 84 final scenes still have explicit romance kinds: 47 flirt, 21 moment, 10 long night and 6 night. Record this as an existing toggle-coverage issue for the romance work, not a reason to increase romance volume now.

## What the reads showed

I read the complete hosted-camp longest, heaviest and quietest camp-days, the world-tour quietest camp-day, and the complete stored episode backlog for hosted-camp's quietest pick. This is a targeted read of selected extremes, not the later full-season editorial pass.

- [Hosted premiere](../superpowers/audits/2026-10-12-td-pacing/hosted-camp/longest.md): 21 scenes, 156 spoken turns and 23 confessional turns. Aubrey's astrology exchange is specific and conversational, but two Chris tours repeat their premise and substantial vote conversations dominate the length. The reader's load is much larger than “21 scenes” implies.
- [Hosted episode 8](../superpowers/audits/2026-10-12-td-pacing/hosted-camp/heaviest.md): 22 scenes, including ten vote scenes and eleven consecutive heavy-tagged entries. Gwen/Gabby and Lake/Trent repeat almost the same vote-count pitch with different names. Preserve distinct plans and advantage decisions; compress repeated information. Do not insert a joke between two dependent beats merely to alternate H/L.
- [Hosted episode 14](../superpowers/audits/2026-10-12-td-pacing/hosted-camp/quietest.md): eleven scenes still establish Lake's loss, strained friendships, the majority's plan, a stolen-vote decision and false reassurance. The six evening scenes all concern the vote. This day needs no automatic seven-scene top-up.
- [World-tour episode 7](../superpowers/audits/2026-10-12-td-pacing/world-tour/quietest.md): ten scenes include Duncan asking Millie for space and Owen confronting Duncan for repeated mockery. A small day can carry substantial relationship change. The read also exposes existing staging problems: a morning confessional says “this afternoon,” and a kit scene uses a river setting on the plane. These need a separate continuity/writing fix; reordering alone cannot repair them.

The [complete hosted episode backlog](../superpowers/audits/2026-10-12-td-pacing/hosted-camp/quietest-episode.txt) includes off-camera material and diagnostics. It demonstrates why backlog length must not be confused with aired camp length. It also contains existing truth/prose inconsistencies (including a private pitch naming already-eliminated Leshawna and contradictory voting-math explanatory text). Those are recorded findings, not changes made by this audit.

## How to use this for stage 2

Make each builder safe to reject before introducing the budget. For a turn, proposing a scene must not consume its setup, reserve its lines, mark an event aired or move a bond. Commit those effects exactly once when the final scene airs. Tests should cover rejection, acceptance, competing proposals and save/replay behavior. Keep proposal RNG consumption deterministic and record any intentional changes to the sequence; pure state proposals do not automatically preserve RNG order.

For the later selector, carry source identity, central participants, additional speakers, dependencies, dialogue cost, explicit tone and commit effects with each candidate. Protect only necessary vote information and selected dependencies. Prioritize due continuations with expiry windows. Penalize rolling concentration relative to available cast; reward genuine new interactions without penalizing useful continuity.

Concrete edit target: in hosted episode 8, retain the two distinct vote plans but shorten a second near-identical count rehearsal. Preserve the separate idol/steal decisions and linked false reassurance. Use the recovered room for an already-grounded relationship development if one exists. This requires knowing what each scene adds, beyond its vote tag.

## Reproduce and inspect

Run from the repository root:

~~~sh
npm run audit:td-pacing
node tools/td-pacing/analyze.mjs
npx vitest run tests/td-pacing-metrics.test.js
~~~

The first command replays the paired matrix; the second recalculates saved evidence without replaying. Venue batches bound memory because a single process accumulating all forty runs exhausted the default Node heap in both traced and plain modes. Each batch runs eight traced and eight plain seasons. The audit runner lives under tools and uses its own Vitest config, so default tests and audit:all do not accidentally launch it.

Matrix: five venues (hosted-camp, survival-island, film-lot, carnival, world-tour), two seeds (1729, 2026), romance enabled/disabled and coaches present/absent. Sixteen fixed contestants; coach settings add Alejandro and Izzy. Date, complete roster/stats/kits, initial config, per-run overrides and fingerprints are saved in each venue's manifest. This is one cast and two seeds, not a population-wide balance estimate. Coach seasons can run longer and contribute more camp-days.

[Evidence directory](../superpowers/audits/2026-10-12-td-pacing/): readable summary/derived metrics and observation check, plus per-venue compressed candidates, days, rolling shares, pending books, attempted continuations and complete camp transcripts. Each venue also has longest/heaviest/quietest camp-day reads and their complete stored episode backlogs. Source-line provenance refers to the measured revision.

Measurement definitions and limits:

- Final aired output is read through campFeed after director cuts and coach visibility. Candidate totals reconcile exactly with final scene totals. Raw engine events, constructed offers, replacements and final output are separate states; a replaced opener is not necessarily an omitted story.
- Main-pool rejection reasons are observed at the actual guards. “Selected-not-rendered” and “offered-then-cut” are intentionally coarse where no narrower guard is observed. Raw romance events outside the pool are recorded, but this is not an exhaustive count of every possible engine event or uncalled builder.
- The opportunities file records attempts at the writer boundary. Despite the internal observer hook name eligible, it does not enumerate all eligible setups. A builder skipped for room or busy people creates no attempt. Pending books are before/after inventories; they do not prove eligibility or missed deadlines.
- Central pairs use authored who.a/who.b only when both actually speak. Extra speakers, including witnesses, are recorded separately; they do not create all pair combinations. Group-only scenes without two speaking central roles do not enter the pair denominator.
- Person exposure counts say and conf turns, including hosts/coaches where present. Three-episode windows pool camps and include all observed speakers. Appearance share is also stored separately.
- H/L/N is a metadata-based diagnostic proxy, not sentiment analysis: kit and romance scenes may be serious, and friendship labels can hide tension. Neutral entries break runs. Counts span pre/post output without inserting a challenge separator. Explicit authored tone is needed before using this to reorder scenes. Inferred scene blocks are likewise heuristic, not verified dependency chains.
- Stage 1 reads saved output; it changes neither the conflict rate nor the director's state transitions. No browser UI or production dialogue was edited.

## Validation

- Forty traced seasons and forty plain seasons completed; 40/40 output fingerprints matched.
- Four metric fixture tests passed. A relocated-runner smoke season also passed (19 camp-days).
- Saved-data analysis passed, including aired-candidate/day-total reconciliation.
- The optional repository registration guard failed on 78 existing files. Recomputing its exclusions with HEAD's package scripts produces the same 78; none are this audit. The new metric fixture is collected by the default suite. This is not a clean full-suite claim.
