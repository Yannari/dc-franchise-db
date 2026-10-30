# Perfect Match — the stretch and its fire pit (design, 2026-10-30)

## 1. Why

The user, 2026-10-30: the Perfect Match simulator is "super boring, not
imaginative, not interesting and super repetitive — a chore to finish the season",
while Big Brother is "super fun". They approved the direction after reading a
hand-written rewrite of season 7 episodes 13–15
(`transcripts/pm-season-7-TEST-ep13-15.md`, gitignored) beside the engine's
own (`npm run pm:transcript`, seed 7).

The earlier two overhauls (dialogue rebuild 2026-10-22, episode overhaul
2026-10-25) fixed the LINES and gave the day storylines (`js/pm/threads.js`).
The season is still a chore because of how it is put together, not how it is
written. Measured on seed 7 (25 episodes, 12,752 lines):

| What | Seed 7 |
|---|---|
| Episodes in which nobody leaves | 15 of 25 |
| The first couple of the season, still together at the final | Priya + Jordan, ep 1 → final |
| Lines per episode | ~500 |
| friendship / chat / deep-chat / group-chat / comedy scenes | 115 / 77 / 69 / 68 / 55 |
| argument scenes | 38 |
| "It all gets too much" (breakdown) sections | 17 of 25 episodes |
| "my stomach has just dropped" / "Did you see that?" / "about a hundred chances" | 10× / 18× / 6× |
| Two of four goodbyes on one night saying "Someone finish my cereal" | ep 15 |

What a reader actually sees:

1. **Storylines are set up and never answered.** Sophie pulls Jordan about seven
   times across episodes 10–15; Priya watches; nothing changes. Ellie carries a
   secret about Jordan and Sophie for days and never tells Priya. Dan pulls Nadia
   while coupled with Mia, and nothing comes of it. In code: a thread closes as
   `faded` after four episodes (`threads.js settle`), and `runRecoupling` /
   `desire()` (recoupling.js) choose partners without reading any thread.
2. **The fire pit is where the drama happens, and it isn't shown.** In episode 15
   Keisha took Dan from Mia, Mia took him back, Leah took Liam from Tasha, Tasha
   took him back, and Jordan refused Sophie. All of it is in the data
   (`extra.stole`, `reclaim`, refusals), but on screen it renders as eight
   interchangeable speeches. Episode 13 had two more steals (Marcus took Leah
   from Josh, Josh took her back), rendered the same way. Pick order is a
   shuffle, so nothing is held back for suspense.
3. **Everyone is in a storyline at once.** Up to 3 grafts + 2 doubts + 2 secrets +
   2 progress + 2 sparks, plus triangles, rivalries, crushes and arcs, with
   `HEADLINES = 5`. With almost everyone after someone else's partner, no single
   betrayal matters.
4. **Filler around the stories.** Nineteen texture scenes a day (`TEXTURE` in
   season.js), plus reactions, plus debriefs. Some texture scenes have no subject:
   "I told you that in confidence." "I only told one person!" — told what?
5. **No game.** Big Brother is fun because characters make decisions on screen
   for reasons the viewer heard, and the decision is the episode's climax.
   Perfect Match's real show has that too (couples for safety, steals planned the
   day before, "is this real or for the game?"), but here a pick is a hidden
   desire score.

## 2. Goals

- **G1. A stretch is one story with a climax.** The episodes between two dumping
  ceremonies are a STRETCH. It is about one main storyline (A) and at most two
  smaller ones (B, C). Its fire pit answers all of them, on screen.
- **G2. Nothing set up is dropped.** Every graft, secret and doubt the viewer
  watched gets an answer at or before its stretch's fire pit. `faded` stops
  being a way for a featured story to end.
- **G3. The fire pit is the main event.** Steals, take-backs, refusals and
  left-standing moments are their own scenes. The pick order holds the A story's
  answer back. Each pick's speech names what it is answering.
- **G4. Some islanders play the game on screen.** A pick made for safety, a
  planned steal or a fake couple is talked through BEFORE the fire pit and pays
  off AT it.
- **G5. Every episode ends on a hook,** and the next one opens with it.
- **G6. Shorter, and every scene has a subject.** Texture that carries no story
  fact is cut. Target length: see §7, open question 1.
- **G8. Games are part of the stretch.** A challenge's set-up, moments and
  aftermath play the A/B/C stories (who kisses whom in Suck and Blow, who soaks
  whom in The Headlines, and why), and each game is long enough to be a real
  scene (§7.1).
- **G7. Hard limits on repetition,** checked by tests: a stock line at most twice
  a season and never twice in one episode; a breakdown section at most once a
  stretch; goodbyes on the same night never share a line.

## 3. Non-goals

- New dialogue volume. The pools are big enough; the problem is what they're
  used for.
- Changing who wins. The public vote, the final and the season calendar
  (`schedule.js`) stay as they are.
- The stepped viewer (`js/vp-pm/`). It plays whatever the engine writes; any
  viewer work is a separate request.
- The Big Brother rule set. Perfect Match stays love-first (see the anti-goals).

## 4. Anti-goals (what makes this a failure even if it runs)

- **Big Brother with a pool.** Most picks must still be about feelings. The
  game layer is a few islanders, not an alliance system.
- **The text deciding results.** A story can't change who someone picks. The
  pick is `desire()`'s; the story makes its causes visible and holds it back in
  the order. (The drag-race three-step rule applies here too.)
- **Forced convergence.** A storyline that has a real reason to be unresolved
  (the islander is still unsure) can carry into the next stretch, but it does so
  out loud ("I don't know yet"), never by being silently forgotten.
- **Same-shaped stretches.** If every stretch is "graft → secret → steal", it's
  repetitive in a new way. A stretch's A story can be any thread type, and a
  quiet stretch is allowed when the villa is quiet.

## 5. The design

### 5.1 The stretch plan (`js/pm/stretch.js`, new)

At the first episode after a dumping (and at the first coupling), build a plan
from the live threads, triangles, rivalries and crushes, the same way Big
Brother's week plan is one truth (memory: project_bb_writing_overhaul):

```
state.stretch = {
  from: ep, ceremony: ep of the next recoupling / dumping (from the schedule),
  a: threadId, b: threadId|null, c: threadId|null,
  hooks: [],          // filled as episodes end (5.5)
  plans: [],          // game moves announced (5.4)
}
```

- **Choosing A.** Score each live story by what it puts at stake: does it
  threaten a couple the public loves, does it involve the islanders most likely
  to be left standing, how many featured islanders it touches, and how long it
  has run without an answer. Proportional weights, no thresholds (CLAUDE.md).
  B and C come from the next best, with no shared islander with A where
  possible.
- **Everyone else is background.** Threads outside the plan keep their state
  changes but play at most one SHORT beat a stretch. New threads can still open
  (a bombshell arrives); one that outranks B replaces it at the start of the
  next episode, never mid-episode.
- **`HEADLINES` becomes the plan's three, plus the background beats.** Thread
  caps (`MAX`) stay as they are, since they decide the state, not the screen.

### 5.2 Answering at or before the fire pit

`threads.js settle` gets a deadline: a planned thread that is still open on the
ceremony night must close in the ceremony itself, by what the ceremony does:

| Thread | The answer at the fire pit |
|---|---|
| graft (c after t, who is with p) | t is picked by / picks c (won), stays with p (stayed), is refused (refused), or c picks someone else (gave up). The pick speech names it. |
| secret (w knows what x did) | Pressure on w rises with each episode toward the ceremony, in proportion to w's loyalty to p and boldness. If w still hasn't told, it comes out at the debrief or w's beach hut says why not, and the secret carries into the next stretch as an A candidate. |
| doubt (a going off p) | The pick: a stays with p (recommit) or goes elsewhere (ended). |
| progress / spark | The pick, said as what it is ("we made it official on Tuesday"). |

`faded` stays for background threads only.

### 5.3 The fire pit (moments.js recoupling, talk/recouple.js, talk/ceremony.js)

- **Pick order.** Still drawn by the rules (`runRecoupling`), but within those
  rules: the A story's decider picks late, a planned steal goes before its
  victim, and someone whose partner is in danger picks after the threat. Ordering
  changes no pick, because `desire()` is computed with the same inputs. Verify
  this with a test that runs the same seed with both orders and gets the same
  couples. If it doesn't, the order goes back to the shuffle and only the
  rendering changes.
- **Steal scenes.** `stoleFrom` and `reclaim` get their own kinds:
  `recouple-steal` [picker, picked, victim] with the victim's reaction on the
  bench, and `recouple-takeback` [victim, picked, thief]. The left-standing
  moment (`dump-verdict`) names who took whose partner.
- **Speeches that cite.** A pick's speech reads the stretch's facts: the
  thread's answer, a kiss in a game, a refusal earlier in the night, a secret
  told. A generic pool entry is only the fallback.
- **Reactions.** One line from the person most affected after every pick that
  changes a couple.

### 5.4 Game moves (`js/pm/game-style.js`, new, modelled on bb/game-style.js)

- **Style per islander**, from `intent` (`win`, `money`, `fame`, `stir`),
  archetype and stats: `genuine` (the default, most of the villa), `safe`
  (picks what keeps them in), `strategist` (plans picks and steals), `stirrer`.
  Nice archetypes are never stirrers (CLAUDE.md archetype rules). A style can
  turn mid-season (a genuine islander dumped by their partner turns safe).
- **The plan scene.** The day before a ceremony, run a no-dice forecast of
  `desire()` for each picker. A non-genuine picker whose forecast pick is a steal,
  or a safety pick over their partner, gets a `game-plan` beat with a friend
  ("it's not cold, it's maths"). The friend now knows, which is a secret thread
  for the next stretch.
- **Payoff.** The ceremony renders the planned pick as the plan's payoff, and
  the debrief says whether it worked.
- **"Is it real?"** A `safe` couple gets the villa questioning them as a B or C
  story candidate.

### 5.5 Hooks (end of episode)

The last scene of every episode is a hook, taken from the A story's next beat
in this order: a text (`recouple-text`, a date, a challenge), an unanswered
question ("I don't know"), someone seeing something. The next episode's cold
open (`vp-pm/steps.js coldOpen`) plays it back first. No episode ends on a
debrief that closes everything.

### 5.6 Cutting

- `TEXTURE` drops (exact numbers depend on §7 Q1). Texture kinds lose `chat`,
  `friendship` and `comedy` entries that have no subject fact; what's left must
  carry a fact from the stretch (a story, a challenge, a recent ceremony).
- A breakdown section at most once a stretch, and only from an A or B story event.
- Reactions (`group-chat`, `bed-chat`) only for the plan's stories.

### 5.7 Repetition limits (tests)

`tests/pm-season-read.test.js` (new, 3 seeds, Season 1 cast and the synthetic
cast):
- No spoken line of 25+ characters more than twice a season; never twice in
  one episode.
- No two goodbyes on one night sharing a line.
- At most one breakdown section a stretch.
- Story kinds use pronouns after the first naming in a turn (the
  "Josh knew exactly what Josh was doing" class): a sentence naming the same
  islander twice fails.

## 6. How we'll know (the audit)

Add to `npm run audit:pm-spec`, each with the seed-7 number as the baseline:

- **Payoff rate:** the share of planned threads closed by an answer (won /
  stayed / refused / gave up / told / ended). Target ~100%; baseline: count
  `faded` now.
- **Steals shown:** steals and take-backs rendered as their own kinds, out of
  the steals in the data. Target 100%; baseline 0.
- **Picks that cite:** the share of ceremony picks whose speech names a stretch
  fact. Target over half.
- **Couples changed per ceremony:** recorded, not targeted. If it doesn't move,
  the drama was only ever in the rendering, and that's worth knowing.
- **Lines per episode** and the **top 10 repeated lines**, printed.
- **Game moves:** plan scenes a season and how many paid off.

And the main test is the one that found every real defect: play a season and
read it, then hand the user an episode stretch to read beside the test rewrite.

## 7. The user's answers (2026-10-30)

1. **Episode length: 300–350 lines.** In their words: "try 300/350, I don't want
   short and not thought phase like game". The audit target is 300–350 lines per
   villa episode (the old ~500 minus the filler, with the stretch scenes kept
   long). Read as: no part of an episode may be short and thrown away. **That
   includes the games (challenges):** today a game is a text, two quick worries,
   rules and fragments (seed 7 ep 14, The Headlines). A game in the stretch has a
   set-up from the stretch's stories, moments that play them (who throws the
   drink at whom, and why), and an aftermath that one of A/B/C picks up (G8).
   *This reading of the answer is the builder's; confirm it with the user on the
   first read.*
2. **Game layer: proportional to the cast.** "Depends on how many strategists
   are cast." No fixed count: each islander's style comes from their own intent,
   archetype and stats (5.4), so a cast with no strategists plays a season with no
   planned moves, and a cast full of them plays a scheming one. The audit prints
   game moves per season against strategists cast, to show the two move together.

## 8. Build order

1. `stretch.js` plan + the deadline in `settle` (5.1, 5.2). Read a season.
2. Fire pit: order, steal and take-back kinds, citing speeches, reactions (5.3).
   Read the seed-7 fire pits beside the test rewrite.
3. Hooks and cold-open playback (5.5).
4. Cutting (5.6) to 300–350 lines, then the repetition tests (5.7). Fix what
   they find.
5. Games inside the stretch (G8): `challenges.js` / `challenge-frame.js` read
   `state.stretch` for who is cast in each moment, and their aftermath feeds the
   plan.
6. Game styles and plan scenes (5.4).
7. Audit numbers (6), then a full season read, then hand the user a stretch.

Bump `PM_ENGINE`: an old season keeps playing as it was written
(`restoreFromAired`).

## 9. Calls made without the user (check these)

- **Casa Amor is its own stretch,** and its A story is Casa itself (who strays,
  who stays). Its existing temptation mix stays; the stretch rules apply to what
  is shown, and stick-or-twist is the fire pit.
- **A stretch ends at any exit night,** not only a recoupling: public-vote and
  villa-vote dumpings close a stretch too, and their fire pits answer the plan.
- **A plan can fail or change.** The forecast has no dice, and the real pick
  does. When they differ, the islander changing their mind at the fire pit IS
  the scene, with the friend who heard the plan reacting.

## 10. Left to the builder

- Exact weights for choosing A, and the secret-pressure curve: calibrate on the
  audit; proportional terms only.
- The writing of the new kinds, under the PM dialogue rules
  (docs/pm-dialogue-style.md, memory index_feedback_writing): plain talk, no
  brand names, every scene names its subject.
- Whether triangles and rivalries feed the plan directly or through the thread
  shapes they already resemble.
