# TD: the plan talk stops repeating itself — 2026-10-14

Step 3 of the story rework ([step 1](2026-10-14-td-story-step1.md)): "the strategy, the plan". Step 1 had already
doubled the strategy outside the vote (1.8 to 4.1 scenes a camp-day). What was left was the vote talk itself: whole
scenes came back two or three times a season, and some were false after the first night.

## Measured first

Lines inside vote scenes, normalised (names and numbers blanked), counted per season over the 40-run matrix: 12.4% of
them repeated within their season. The top repeats, 2.4 to 2.5 times a season each:
- the target feeling safe (`vt2.sure`, `vt2.safe`): four and three versions, mostly gated on the speaker's voice, so a
  person matched one and got it every time they were the target ("I'm confident because I counted. X has nobody.");
- the generic plan scenes (`n-vp-specific.js` glue and math), copied into every reason's pool under a different id, so
  the once-a-season rule never saw them as used ("It's N against N... the one person who changes their mind");
- the side forming (`vp.form`), four versions written for the first day and played on any night the viewer hadn't seen
  the side form: "They've been together since this morning", "Everybody's going to say they didn't play the game on
  day one" in episode six.

## What changed

- **The season reads a scene by its words** (`write.js keyUses`): a template used under one id counts as used under
  all of its ids, as the episode rule already did.
- **A plan with no fresh whole scene left is built beat by beat** from tonight's own reason and count, instead of
  replaying a whole scene from an earlier night. The side forming is said once a season per version, then left out.
- **The target feeling safe** has three more "a friend sits with them, writing their name" scenes and four more "sure
  it's somebody else" scenes for any voice; once they're spent the scene steps aside to the target's own confessional
  (22 versions) rather than replay one.
- **The side forming** is true to its night: the four first-day versions are for episodes one and two ("this early",
  not "day one" or "since this morning"), and three later ones form a side from the voting record ("Have you noticed
  {theirSide} always end up writing the same name?").
- Found in the read: "stretched out like her owns the place". The shared pronoun pass (`vp-tr/tidy.js`) took "like" for
  a preposition; after like/as/than with a verb of its own, the name now stays.

## Measured after

| Vote talk, over 40 seasons | Before | After |
|---|---|---|
| Lines repeated within their season | 12.4% | 2.9% |
| The most repeated line, times a season | 2.5 | 1.4 |

The day's mix held (a camp-day: vote talk 3.86, strategy outside the vote 3.96, drama 1.64, romance 0.44, friendship
1.70). Read on a post-merge tribal night: Courtney's blow-up becomes Alejandro's reason ("Everybody saw that fight...
Nobody's going to be shocked"), Courtney counters on Izzy and Geoff as a pair, Harold breaks from her plan in private,
Izzy reads the politeness and knows, Courtney is sure it's Izzy.

## Verification

- All 25 TD test files (231 tests) and the six suites that read the shared pronoun pass (31 files, 416 tests).
- `docs/superpowers/audits/2026-10-14-td-story-step3/`.
