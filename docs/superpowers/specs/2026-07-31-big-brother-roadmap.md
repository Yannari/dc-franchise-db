# Big Brother — road to a complete simulator

Written 2026-07-31, after the house became playable end to end.

The goal this plans toward is the one that matters: **a complete Big Brother
simulator you can play**, not a tour of how Big Brother works. Anything that
only explains the format to the reader is cut.

## Where it actually stands

Measured, not estimated:

| | |
|---|---|
| House events | **85** — ceremonies 15, social 24, deals 17, house-life 12, phases 17 |
| Competitions | **8** across hoh / veto / arena / tiebreaker |
| Events per week | **~105** (22–30 per stretch of house life) |
| Twists built | Double Eviction, Instant Eviction, Have-Nots |
| Season modes | BB Block Buster (three nominees) |
| Venues | The House, The Compound, The Resort, The Manor |
| Source files | 27 |
| Tests | 101 files, 889 passing |

A season plays from move-in to a jury vote. The week has a shape, the house
talks, alliances form, people walk out, and the visual player covers every act.

## What is missing

Ordered by how much each one is felt while playing.

### 1. ~~Nobody plays harder because they are in danger~~ — DONE 2026-07-31

`gunningFor()` in `js/bb/strategy.js`, applied by both scorers. Danger is read
from the game — sitting on the block, and having enemies who outnumber the
people who would keep you — and nerve converts it into performance.

Calibrated by playing 275 weeks: with no motivation a nominee won the veto
33.5% of the time, which is exactly the random share of a six-player field
containing two nominees, proving it was doing nothing. It is 46.5% now.

### 1b. The veto ceremony is still a formality — NEXT

The ceremony itself resolves in one line: used or not used, replacement named.
Everything interesting happens around it and none of it is staged — the veto
holder's deliberation, the two nominees working on them, the HOH being told
what is about to happen to their week, the replacement finding out in the room.

The pieces exist: `power-veto-promise` and `power-veto-draw-lobby` cover the
lobbying, `power-replacement-fallout` and `power-saved-guilt` cover the
aftermath. What is missing is the ceremony as a SCREEN — a staged reveal with
the block before, the decision, and the block after, the way the nomination
ceremony turns keys one at a time.

### 1c. ~~The house's vote planning is shallower than Total Drama's~~ — DONE 2026-07-31

Asked directly, and the honest answer is no. The two are not at the same level.

Total Drama models a vote as a set of COMMITMENTS: each voter has a preferred
target, an alliance plan that may assign them a different one, and a
`commitmentStrength` describing how firmly they have promised it. On top of
that sit reliability summaries (do this alliance's plans usually hold),
late ballot transitions with named triggers — `plan-held`,
`initial-commitment-held`, `modeled-option` — a comparison of what people said
against what they did, and fringe consolidation, which is the bandwagon: a
target sitting on a single vote gets abandoned for one of the leaders unless
the voter's commitment is strong.

A house models a vote as PREFERENCE PLUS PERSUASION. `initialVotePreference`
scores each nominee on perceived bond, threat, alliance strength, whether the
voter is already targeting them and how suspicious they are; `campaignAttempt`
then runs persuasion against resistance and can flip it. That is a good
first-order model and it is genuinely less than the above.

**Closed 2026-07-31.** All four gaps below are built; the section is kept
because the reasoning still explains why the vote is shaped the way it is.

- ~~**Bandwagoning.**~~ `applyHouseBandwagon` — a target sitting on a lone vote
  is abandoned for a leader unless the voter's commitment is strong.
- ~~**Alliance vote plans.**~~ `applyAllianceVoteBloc` — a bloc agrees a target
  and whips the members who were not firmly committed elsewhere. The ones who
  were stay put, which is how a bloc discovers it has a problem.
- ~~**Commitment strength.**~~ `houseVoteCommitment` reads clarity of
  preference, whether they shook on it, alliance membership and loyalty — and,
  since the endgame tier exists, whether the person they are keeping is somebody
  they promised the end to. A final two outranks the alliance whip, which is
  where somebody's real game becomes visible.
- ~~**Stated versus actual.**~~ Ballots carry `stated` alongside `evict`, so a
  vote somebody promised and did not cast is on the record and in the transcript
  under "how the plans changed".

### 2. The jury is seated but barely alive

`seatBBJury` records who evicted whom and `simulateJuryVote` reads it, but the
jury house does nothing between evictions. Jurors do not compare notes, do not
change their minds, and do not arrive at the finale with a story.

Fix: a jury-house act per week after the jury opens — a handful of events where
jurors relitigate their own eviction and shift their read of the finalists.
Reuse the Total Drama Jury House interlude that already exists.

### 3. Returning players

Battle Back is designed and not built (see the twist backlog in the mode design
spec). A house with no way back in loses the format's best mid-season swing.
Needs: an evicted-houseguest competition, a re-entry act, and jury bookkeeping
for somebody who was evicted twice.

### 4. The remaining twist backlog

29 entries are catalogued in `2026-07-30-big-brother-mode-design.md`. In the
order they would change a season most:

- **Battle of the Block** — two HOHs, two pairs, the winning pair dethrones its HOH
- **Coup d'état / secret powers** — a hidden power that overturns a ceremony
- **Pandora's Box** — a private reward with a house-wide consequence
- **Diamond Veto** — the veto holder names the replacement
- **Triple Eviction** — the double, once more

Rule already recorded and worth repeating: **nothing enters the catalogue until
its mechanics exist.** A listed twist that does nothing is indistinguishable
from a broken one.

### 5. Signature competitions

All 8 competitions are stat-scored families. The format's famous ones — OTEV,
BB Comics, Hide and Go Veto, Zingbot week — are set pieces with their own
narration and their own rules, the equivalent of a Total Drama twist challenge.
Each is a self-contained build.

### 6. Weekly texture that exists in the show and not here

- **Punishments and rewards** attached to competitions (a costume for a week,
  a phone call home) — real modifiers with real social cost
- **The diary room** as a recurring confessional voice rather than one event
- **Veto players drawn by ballot** — the draw is a moment and it is currently silent
- **America's vote / audience powers** — the popularity system is wired now and
  nothing consumes it in the house

### 7. Presentation gaps

- The **eviction night** screen is the last thin one — it lists ballots without
  the theatre the vote deserves
- **Jury management** has no screen at all
- The **finale** works but is three competitions and a vote; it has none of the
  ceremony the rest of the player has

## Known bugs

- **Wheel of Misfortune × Tied Destinies** (Total Drama, not the house): a
  member of the immune pair can be eliminated as the tied-destinies partner.
  Immunity is not respected across the two twists. Fails
  `tests/wheel-tied-destinies.integration.test.js` intermittently — deliberately
  NOT seeded, because seeding it would hide a real defect.
- `seasonConfig.qem` drove nothing for as long as it existed; now wired, but
  Total Drama's medevacs still come from the survival system rather than from
  the shared departures module. Worth unifying.

## Done since this was written

- **Game plans and endgame deals** (2026-07-31) — `gs.intentions` was a shell in
  this format: every field empty but `targets`, `planStyle` hardcoded
  `'reactive'` for everybody, and zero references to `.shield` or `.goat`
  anywhere in the house. Now `js/bb/plans.js` forms and revises real plans
  (shield / goat / core / betrayal conditions / jury plan, style from stats) and
  `js/bb/deals.js` adds a tier — working, final three, final two — with a
  private per-side sincerity. They are read at nominations, the veto, the vote
  and the final cut, which used to be decided on projected jury margin alone, so
  nobody ever kept their word because nobody was ever asked to. A broken final
  two is now punished by the jury and shown on screen and in the transcript.
  See the design spec for the load-bearing rules.
- **Competition motivation** (§1) — nominees now play like it matters
- **The HOH room and the block** — thirteen events for the two places a week
  actually happens, including refusing entry and promising the veto
- **Rooms** — location is a property of an event and the feed reads by camera
- **Volume** — 22-30 beats a stretch, about 105 a week, up from eighteen
- **The scheme layer** — Total Drama's nine social schemes, bridged not rebuilt
- **The romance pipeline** — was creating sparks and promoting none of them
- **Per-episode maintenance** — eight shared systems the house never ran

## Sequence

The order that gets to "complete" fastest, because each step makes the next
one more visible:

1. ~~Competition motivation~~ — done
2. **Eviction night + jury screens** (§7) — the week already produces the data;
   this is the last thin screen and the one with the most theatre in it
3. **Vote planning** (§1c) — bandwagoning first, then alliance blocs and
   commitment strength. Mostly a bridge to js/vote-planning.js
4. **Veto ceremony as a staged screen** (§1b)
5. **Jury house life** (§2) — makes the ending mean something
6. **Battle Back** (§3) — the mid-season swing
7. **Battle of the Block, Pandora's Box, secret powers** (§4)
8. **Signature competitions** (§5) — one at a time, each a set piece
9. **Punishments, audience powers, the draw** (§6)

Steps 2-5 are what stand between the current state and a season that feels
complete to play. Everything after that is depth.
