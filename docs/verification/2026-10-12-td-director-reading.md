# Total Drama director reading pass — 2026-10-12

## Scope and method

Three seeded, played 16-player seasons, romance enabled, default challenge schedule: hosted camp (1729), carnival (2026), World Tour (81). Cast: Gwen, Leshawna, Heather, Duncan, Courtney, Owen, Lindsay, Trent, Julia, Millie, Aubrey, Lake, Gabby, Bowie, Yul, Bruno; alternating Bass/Gophers. Each completed 14 episodes, including the finale. Metrics concern final aired camp feeds, not every engine event or elimination screen.

The probe exported every camp scene in episode order. Automated checks measured scene counts, distinct spoken participants, exact repeated exchanges, per-episode speaker coverage and tracked storyline steps. Manual reading concentrated on romance, defense/argument callbacks and grievance chains. This is not a claim that all roughly 80,000 transcript words were manually audited.

| Venue / seed | Aired scenes | Scenes with 3+ speakers | Exact repeated exchanges | Campers without dialogue/confessional |
| --- | ---: | ---: | ---: | ---: |
| Hosted camp / 1729 | 319 | 71 | 0 | 0 |
| Carnival / 2026 | 326 | 75 | 0 | 0 |
| World Tour / 81 | 323 | 73 | 0 | 0 |

Machine-readable counts are in ../superpowers/audits/2026-10-12-td-director-reading/summary.json. Samples were rerun after the ballot fix; replay-only guards and the island-pool additions do not affect these live, non-island samples.

## Defect found and corrected

Before this change, threads.js marked a private ballot as known when its target received two votes or fewer. In the hosted-camp sample, Trent confronted Duncan with “Your vote was on me, Duncan. I can count.” A later scene had Bowie identify Trent from a similarly small count. Neither inference established an individual ballot.

New grievances stay unknown until a final aired caught.face confrontation from the engine's detected-flip system identifies that voter to the actual victim. Both participants must speak, the recorded target must match, and the exposure must concern the previous vote. Confessionals, unseen events, another ally's confrontation and a small tally cannot supply this knowledge. Plain-data provenance survives serialization. Unsupported legacy certainty is rejected. A later exposed vote remains eligible even when an earlier vote by the same person stayed secret.

The director uses the same knowledge check before explaining a vote plan as retaliation. Exposure dates cannot leak into an earlier episode. Historical regeneration neither records disclosures nor consumes live thread chapters; already saved scenes retain their original text. Live exposed grievances still air and advance once.

Affected grievance writing no longer claims a day-one friendship, an earlier apology, an intervening vote against a liked player, or that counting votes reveals a voter. The conversation now addresses an exposure the viewer actually saw.

## Variety regression caught during verification

The first wider TD run failed td-island-script.test.js: eight repeated island scene IDs in 400 scenes reached the existing strict 2% limit. A diagnostic replay identified an exhausted persistence/practice pool among the repeats. Added four distinct practice scenes (im.g7–im.g10) in isle-more.js. The original repetition threshold was retained; all 31 island/script tests then passed.

## Remaining director work

The existing gs.tdStory.lines ledger records 1, 3 and 1 storylines with three aired steps in these samples. That measure excludes separate vote arcs, kindred threads and the new follow-up system, so it is not the total number of connected stories. The next useful pass is to measure those systems together, then improve sustained romance/rivalry progression where an actual engine change or witnessed exchange warrants it. No fabricated kisses, secrets, props or conflict should be added merely to satisfy a count.

These samples contain no exposed grievances after the fix; positive reachability is therefore checked by a live-director regression fixture with an actual exposure, alongside negative and save/replay cases.

## Verification

Final frozen-code verification: **23 files, 194 tests passed** (all tests/td-*.test.js plus tests/imports-are-committed.test.js, four Vitest workers). This includes 13 ballot-knowledge tests covering unknown/exposed votes, absent or viewer-only disclosure, repeated votes, old saves, chronological knowledge, historical replay and live chapter reachability. Three additional temporary full-season reading probes passed; their count is separate. git diff --check passed. The all-show repository suite has known failures outside this scope documented in 2026-10-12-td-followups.md; this pass does not claim an all-show clean run.
