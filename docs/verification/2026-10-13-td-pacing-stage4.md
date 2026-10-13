# TD director pacing, stage 4: who gets the last places — 2026-10-13

Stage 4 of the pacing plan ([stage 3](2026-10-13-td-pacing-stage3.md)). Stage 3 gave the day one budget; within the
story and the colour, the first system to propose took the room, and every builder cast a's closest friend as the
partner. Stage 4 decides the last places by airtime, on both sides: what is selected, and who is cast.

## The rule

**Selection** (`director.js selectScenes`, `airtimeScore`). The vote's information and the payoffs that are due keep
their order: they are continuity, not airtime. Within the story and the colour, the next place goes to the best
candidate given the day so far:
- the central people's spoken and confessional turns over the last two episodes against the camp's average
  (`gs.tdStory.airtime`): under-heard up, over-heard down (weight 0.9 per unit of ratio, capped at 3x);
- a third scene in one day costs 1.2 per extra scene, more than the systems' own order can make up;
- a pair already on screen today −1.5; a pair never seen +0.6; a pair seen recently −0.35 per episode
  (`gs.tdStory.pairAir`, the last six episodes a pair aired);
- the system's own order (the storyline's drama, the quick cuts' new faces) as a weak tie-break (up to −0.5).
- A colour scene about somebody the last two episodes heard from at under 60% of the camp's average competes with the
  story, not the colour (`underheard` in the log). Read on the matrix: Lindsay spoke 7 lines in three merge episodes
  while her life talk and her camp game waited behind the vote and the storylines every evening.

**Casting** (`foilFor`). The partner in a challenge moment the engine named one person for, a kit bit's teaser, the
banter between friends, a running gag's foil and an inner-life scene's confidant: among the people within two bond
points of a's closest, the one heard least lately, least often seen with a, and least cast today. Bond still decides
who is eligible. The selection alone could not move the needle: in 327 of 426 quiet three-episode windows the quiet
person had a dropped scene, but only about two scenes a stretch of the day are dropped at all; the builders were
proposing the same best-friend pairs day after day. The "cast today" term came from a read: Owen was Millie's,
Bowie's and Bruno's partner on the same day.

## Measured: a paired control

`TD_NO_AIRTIME=1` runs the same code with stage 4 off (the selection and the casting fall back to proposal order and
closest friend); it reproduced the stage-3 matrix exactly. Same 40 seasons, same seeds; per-run means over every
three-episode window, among the people present for the whole window (hosts and coaches excluded):

| Per run | Stage 4 off | Stage 4 on | Mean change | Runs better | t |
|---|---|---|---|---|---|
| Top speaker, multiple of an equal share | 1.429 | 1.405 | −0.024 | 25/40 | −1.67 |
| Quietest person, multiple of an equal share | 0.614 | 0.642 | +0.028 | 27/40 | 2.95 |
| Gini of turns | 0.140 | 0.129 | −0.011 | 27/40 | −3.14 |
| Fresh central pairs after episode 1 | 18.6% | 19.8% | +1.2 pts | 30/40 | 4.00 |

Over all windows: the top speaker's worst window 2.04 → 1.95 of equal; the quietest person's worst 0.13 →
0.28; people under half their share at the 95th percentile 14% → 9%; the top pair's worst share 39% → 35%. Cover
scenes (somebody nobody heard from, written in at the end) 29 → 22. The day's shape is unchanged: median 17 scenes,
p90 18, none over 22, spoken turns 86/109 → 85/108; the longest heavy run's worst 15 → 13. Kits 1,640 → 1,748, quick
cuts 918 → 989, camp games 365 → 400. Follow-ups 135 → 142, morning-afters 167 → 165, turns 144 → 126: a turn pays off
a relationship with an aired setup, and spreading the scenes across more pairs leaves fewer pairs with one; dropped
turns are 1 (not a loss of payoffs already built).

The effect is real and modest. Most of a loud person's airtime is in scenes this stage does not choose: they lead the
plans, they are the engine's storylines, they are the vote. That is the season, and a real edit is uneven too.

## Fixed along the way

- **An announced double elimination could send one person home.** The engine took the second boot from the vote
  counts; when an idol voided every vote but one name's (Leshawna's idol for Alejandro cancelled all but Gwen's), there
  was no second name, `eliminated` stayed null and the stepped screen did not build. It now goes to a second vote, as
  a surprise double boot does; the stepped Tribal already plays that as "As promised, we're not done", and the first
  round of such a night hands out nothing ("Two of you are going home tonight, so nobody gets a marshmallow until it's
  over") instead of marshmallows to the person the second vote sends home. Seen on the seed the double-tribal test
  uses before the seasons moved on; the path is not exercised by a test now (it needs an idol voiding every other name).
- **Every double boot's second round played the first vote's script.** One Tribal script was written per episode, from
  the first vote; the second round showed it (Gwen at the second vote: "I wrote Noah. We all said Noah. What just
  happened?", Noah already gone; the host asking Noah questions). The director now writes each vote's night
  (`tribal.js firstVoteView/secondVoteView`, `ep.tribalStory1` for the first); `tests/td-double-tribal.test.js` checks
  that no second-round ballot names the person who already left.

## Verification

- `tests/td-budget.test.js` (+6): the last place to the under-heard; a never-seen pair over a worn one; never the same
  pair twice a day; a third scene only when nothing else wants the place; the vote and payoffs keep their order;
  an under-heard person's colour scene competes with the story; the system's order between equals.
- All 25 TD test files (226 tests); coach, backlog, camp, continuity-audit, season-hub suites (33 files, 220 tests).
- `docs/superpowers/audits/2026-10-13-td-pacing-stage4/` (now with each episode's director log, `director.json.gz`).
  The control arm is reproducible with `TD_NO_AIRTIME=1 TD_PACING_OUT=<dir> npm run audit:td-pacing`.

Next is stage 5, rhythm: a merge tribal night is still a short morning and an evening of vote talk.

## Addendum: couples, best friends and feuds (same day)

The user asked whether a couple only gets one scene an episode, and for the same treatment for big friendships and
big rivalries. Measured first: a couple has had about one romance scene per episode since stage 1 (couple-episodes
with 0/1/2 romance scenes: 298/140/4 at stage 1). The cause was not stage 4 but an older main-pool rule, no third
storyline scene in a day for anybody counting the opener and the vote talk: it cut 47% of the engine's romance
moments, because one of the couple is nearly always in the vote talk.

A tie (`look.tie`, 0..1: an active showmance is 1, otherwise the bond either way from 3 to 7) now loses the "seen in
recent episodes" penalty and pays half for a second scene the same day. A couple (`look.couple`) also passes the old
two-scene cap and stays its own partner in casting. Four options were measured on the matrix (romance moments that
air / cut by the cap / Gini / quietest person / fresh pairs):

| Option | Air | Cap | Gini | Quietest | Fresh |
|---|---|---|---|---|---|
| stage 4 off | 28% | 47% | 0.140 | 0.61 | 18.6% |
| stage 4 as committed | 24% | 44% | 0.129 | 0.64 | 19.8% |
| every tie through the cap and kept as partner | 34% | 16% | 0.140 | 0.62 | 18.6% |
| **couples through the cap and kept as partner; friends and feuds the softer penalties only (chosen)** | 28% | 25% | 0.132 | 0.65 | 19.1% |

Exempting friendships and feuds everywhere undid stage 4: big ties belong mostly to the central players. The user
chose the last row. Past the cap, a couple's moments now meet the next rule, one step of a storyline per stretch of
the day (same-storyline cuts 12 → 66): more romance than that is a design question for the romance step, not pacing.
Romance totals swing with which romances form (140 to 166 scenes between runs of the same rule), so the share of the
engine's romance moments that air is the measure. Evidence: `docs/superpowers/audits/2026-10-13-td-pacing-stage4-ties/`.

Also fixed: a double boot's second-round booth still used the first vote's plan scenes ("If Courtney wants Geoff
gone", Geoff already gone): the booth reads only plan scenes whose people are all at this vote, and the second vote's
view drops the first vote's pitches and intel about the person it sent home. Rescue Island got six more "leaning on
somebody" and five more "thriving" scenes (the repetition guard tripped on the new seasons; 5 of 416 now).
