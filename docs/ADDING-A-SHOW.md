# Adding a show to the simulator

Everything you have to touch to add a third show, in the order that keeps the
site working at every step, with the traps named where they live.

Written against the codebase as it stands after Big Brother. Big Brother was
added *without* this document, and most of what follows is the shape of the
mistakes that were made doing it — the ones that only surfaced weeks later, on
a screen nobody thought was show-specific.

**Read this before touching a format, whether you are a person or an agent.**
The facts below were derived by searching the code, not recalled, and §13 has
the commands to re-derive every inventory in it. If a list here disagrees with
what the command prints, the command is right and this file is stale — fix the
file in the same commit as whatever moved.

**The one-line summary:** the registry in `js/shows.js` is the source of truth,
23 modules already read it and need nothing from you, and everything
that still holds its own copy of the show list is listed in §9. Adding a show is
a registry entry plus an engine; the work in between is making sure no screen
falls back to the default show's vocabulary.

---

## 0. Decide what kind of show it is first

Two questions decide most of the work, and both are hard to change later.

**Does it eliminate by vote, or by result?** Total Drama votes at a ceremony;
Big Brother votes in a house with a block in front of it. If your show
eliminates by placing last in a race, you have no ballots — and the voting grid,
the vote history tab, the betrayal ledger and half the social feed have nothing
to draw. That is allowed. It is not a bug to be fixed later; it is a shape the
pages must be told about (see §6).

**Is a round a week or an episode?** This decides the vocabulary everywhere:
`week` vs `episode`, `evicted` vs `voted out`, `houseguest` vs `contestant`.
Get it into the registry in §1 before writing any UI, because every wrong word
that ships gets copied into the next screen.

Write both answers down. §6 is a checklist against them.

---

## 1. The registry — `js/shows.js`

One entry. This is the only file that knows slugs, prefixes, display names and
vocabulary. Twenty-three non-test files import it today:

`awards.html`, `compare.html`, `current-season.html`, `devotees.html`,
`franchise.html`, `js/core.js`, `js/episode-store.js`, `js/fame.js`,
`js/show-switcher.js`, `js/site-header.js`, `js/social-page.js`,
`js/social/adapter.js`, `js/stats-export.js`, `js/wiki-fill-run.js`,
`js/wiki-view.js`, `leaderboards.html`, `rankings.html`,
`season-awards_ref.html`, `season_ref.html`, `seasons.html`, `timeline.html`,
`worker/worker-studio.js`.

Every one of those needs **nothing** from you beyond the entry.

```js
'ridonculous-race': {
  prefix: 'rr', name: 'Ridonculous Race', short: 'RR', emoji: '🏁',
  words: { player: 'racer', players: 'racers', round: 'Leg', exit: 'eliminated' },
  careerStats: [
    ['challengeWins', 'totalLegWins'],
    ['votesReceived', 'totalPenalties'],
  ],
  audience: { strategy: 0.6, mess: 1.3, twist: 1.1, steamroll: 0.8 },
},
```

- `prefix` decides **every filename and storage key** for the show:
  `data/seasons/rr-1-data.json`, `rr_episode_s1_e1`, `AI_ANALYTICS_rr-1`.
  Choose once. Changing it later orphans every file already written.
- `words` is read by the wiki, the season page and both AI fill prompts. A show
  that omits it inherits Total Drama's, which is how a Big Brother season came
  to be described to the writer as a summer camp.
- `careerStats` declares which per-season fields roll up into a career total,
  and under what name. `_rebuildByShow()` in `js/stats-export.js` reads it and
  branches on nothing — `'bb.hohWins'` reaches into the nested block, a bare
  name is a top-level field.
- `audience` is **what the show is FOR**, as the TV ratings read it: a
  multiplier per signal on top of the four demographics' universal tastes in
  `js/ratings.js`. Total Drama sells stunts and romance (`strategy: 0.7`),
  Big Brother sells the vote (`strategy: 1.3`), and the steamroll penalty is
  magnified there because "the same six ran the house all summer" is the
  complaint about that show specifically. Omit it and your show is rated as
  generic reality television — see §2.5, which is the part that actually
  needs your attention.

**The permanent rule you must not break:** *a bare integer is Total Drama.*
`season=14` is Total Drama 14 for ever, every other show is `season=rr-14`.
Every URL, every filename, every storage key on the site depends on it.

---

## 2. The engine

This is the actual work, and it is the part no document can shorten. For scale:
Big Brother's engine is 53 files in `js/bb/` plus 46 event files in
`js/bb-events/`. Total Drama's is `js/episode.js` plus 92 challenge files.

What the rest of the site requires from an engine is small and specific:

- **A season loop** that produces rounds and, at the end, a winner.
- **`gs.episodeHistory[]`** entries stamped with `format: '<your-format>'`. The
  VP screens, the timeline and the replay path all filter on that field, and an
  unstamped episode belongs to Total Drama by default.
- **A finale** that sets a winner, a runner-up and (if there is one) a jury vote.
- **A runnable flag.** `formatIsRunnable()` in `js/core.js` gates the show in
  the UI and currently reads `window._bbRunnable`, set at the bottom of
  `js/bb-run.js`. Add yours the same way — it exists so a half-built show cannot
  be started by somebody clicking through the setup screen.

Dispatch happens in `js/run-ui.js` — `simulateNext()` (~line 950) and again in
the replay path (~line 1116). Both places choose the engine. **Add yours to both** —
the replay path once knew only Total Drama's two engines, so a house had
checkpoints it could never spend.

---

## 2.5 The ratings reader — `js/ratings.js`

**Does the TV ratings system adapt to a new show on its own? Partly, and the
half that does not is silent.**

What adapts for free: the tiers, the four demographics, momentum, the season
verdict, engagement, the retroactive pass. None of that knows what show it is
reading. Register your show and it will produce a number on day one.

What does **not** adapt: `readSignals`, which turns one episode record into
eleven numbers. It has to know where YOUR engine wrote each fact, and every
fact it cannot find reads as zero. A zero is not an error — it is "this did not
happen this week" — so a mis-wired signal produces a plausible rating that is
quietly wrong for ever.

That is not hypothetical. Both existing shows shipped with it:

- Total Drama files camp events one level deeper than Big Brother
  (`{ camp: { pre: [...] } }` against a flat array), so every tone-derived
  signal read zero for fourteen straight episodes.
- Total Drama has no `changed` flag on a ballot — it records a flip in
  `_flipDetectionLog`. Six consecutive seasons were rated as having had no
  blindside in them at any point.

Both were found by playing seasons and reading the numbers. Neither was found
by a test, because there is nothing for a test to catch: the code ran fine.

**So, for your show:**

1. Point each signal at where your engine records it. The ones that need it are
   `blindside` (`flippedVotes`), `predictable` (`statedTarget`), the tone
   signals (`airedEvents`), and `returns`. The rest read fields both shows
   already share — `eliminated`, `votingLog`, `houseAtStart`, `twists`,
   `immunityWinner`/`hoh`.
2. Declare `audience` in the registry (§1). Without it your show is rated as
   generic reality television — the base table, no overlay. That is a
   deliberate neutral fallback rather than inheriting Total Drama's, which
   would rate your show as though it were a different one.
3. **Play a season and print the signals before you believe any of it.** Every
   signal should vary and none should sit pinned at zero or one. This is the
   only check that works.
4. Add your show to `tests/ratings-distribution.test.js`, which re-measures the
   `CALIBRATION` bands and fails when a signal drifts out of the range the
   table claims. That table is a snapshot of one measurement and it rots.

One thing that is deliberately NOT per show: `CALIBRATION` itself. Big Brother
genuinely produces more strategy per week than Total Drama does, and
calibrating each show against itself would erase exactly the difference the
`audience` overlay exists to express.

---

## 3. Setup, cast and config

`js/quick-setup.js` holds `CONFIG_SCOPE`, the declarative scope map — the best-designed part of
this system and the first place to add your show.

```js
CONFIG_SCOPE = {
  toggles: { idol: ['total-drama'], popularity: ['total-drama', 'big-brother'] },
  fields:  { 'cfg-teams': ['total-drama'], 'cfg-bb-havenots': ['big-brother'] },
  sections:{ 'sec-tribes': ['total-drama'], 'sec-bb-options': ['big-brother'] },
}
```

**The rule this encodes, and it is worth keeping:** a control is shown only if
that format's engine reads the value. A house has no tribes to swap and no idols
to hide, and every one of those controls sat on the screen for a Big Brother
season silently doing nothing, until this map existed.

So: add your format to every entry whose control your engine actually reads, add
your own sections, and add nothing else. `tests/format-scoped-config.test.js`
enforces it.

Also here: the show picker (`{ id, name, tag, icon }`, ~line 425), read by `configScopeFor()`, the
blueprint that seeds a default season, and the host options.

---

## 4. Twists

Twists are per-show and already filtered for you. In `js/core.js`, every
`TWIST_CATALOG` entry carries `format:`, and `twistsForFormat()` means a show
never offers another show's twists. Add yours with `format: 'your-format'` and
the catalog UI, the randomiser and the schedule all pick them up.

If a twist has no `format`, it belongs to Total Drama. That default is load
bearing — fourteen seasons of existing twists have no `format` field.

---

## 5. Export and publish

`js/stats-export.js`. Total Drama and Big Brother have separate document
builders (`exportAndFillNarratives`, `buildBigBrotherSeasonDocument`), and
`exportSeason()` picks one on format. Yours joins that switch.

The season document must carry, whatever the show:

| Field | Why it is required |
|---|---|
| `seasonNumber`, `format`, `seasonId` | identity; the publish path refuses an unknown format |
| `placements[]` with `name`, `playerSlug`, `placement`, `status` | every page reads these |
| `winner { name, playerSlug, vote, runnerUp }` | the wiki lead quotes the tally |
| `twists[]` | the season page's Twists section; `_extractTwists()` is show-agnostic |
| a per-round array | **the shape decision below** |

**The per-round shape.** Total Drama exports `votingHistory[]` (episode,
eliminated, votes) and Big Brother exports `weeks[]` (hoh, nominees, veto,
ballots, evicted, haveNots). Nothing generic exists. `roundLedger()` in
`js/wiki-fill.js` normalises both, and the season page's Wiki tab normalises
both again. **Reuse one of the two shapes if you possibly can** — a third shape
means editing both of those normalisers plus the voting grid.

Publishing goes through `POST /api/publish-season` on the studio worker, which
validates the format against the registry and refuses one it does not know. That
refusal is deliberate: two unregistered shows would both write `td-N-data.json`
and silently overwrite each other.

---

## 6. The screens

Each of these reads the record and will quietly describe your show in Total
Drama's words if you skip it. This is the list that is easy to get wrong,
because none of these files look show-specific from the outside.

| Screen | File | What to check |
|---|---|---|
| Season page — Wiki tab | `season_ref.html` | Twists, memory wall, voting grid, competition history, game history, trivia. **All six branch on whether the season has `weeks`.** |
| Character article | `js/wiki-view.js` | `SHOW_META` (name, short, emoji, accent), the infobox's per-season block, the round grid's cell rules |
| Career/dossier | `js/wiki.js` | `SHOW_NAMES`, `_weekRowsFromDoc` (the round grid builder — it has a branch per round shape) |
| Social feed | `js/social/adapter.js` | one `SHOW_WORDS` entry; **components never branch, so this is the only file** |
| Player profile | `player.html` | four separate name/icon maps (see §9) |
| Run tab / timeline | `js/run-ui.js` | badges, the hub, the episode list |
| Viewing party | `js/vp-screens.js` | screens filter `episodeHistory` on `format` |
| Rankings, awards, franchise, compare, leaderboards | those `.html` files | most already read the registry; `compare.html` and `franchise.html` hold their own label maps |

**The trivia trap, twice now:** a line that reads correctly on one show is a
false statement on another. "Reached the end without ever being nominated"
printed over a Total Drama season, which has no nominations; "was evicted"
printed over a camp, which votes people out. Every sentence a screen generates
has to come from that show's own vocabulary, and the registry's `words` block is
where it comes from.

---

## 7. The AI layer

Three workers, and only one needs to know about your show:

- **`worker-season-live.js`** (season builder) — `SHOW_WORDS` at the top of the
  wiki-fill section is a fallback map; the client sends `words` from the registry
  with every request, so a registered show needs no worker edit. Verify by
  sending one request and reading the prompt back.
- **`worker-episode-live.js`** (episode writer) — Big Brother has its own
  narrative prompt. A new show either reuses one or gets its own.
- **`worker-studio.js`** — validates format against the registry; nothing to add.

The wiki fills (`js/wiki-fill-run.js`) are show-agnostic: they read the season
document and the transcripts, both keyed by prefix.

---

## 8. Data and storage

Everything is keyed by prefix. Nothing needs a migration, because Total Drama
keeps the bare-integer key it has always had.

| What | Key |
|---|---|
| Season document | `data/seasons/rr-1-data.json` |
| Episode transcript | `rr_episode_s1_e1` (`js/episode-store.js`) |
| Episode analytics | `AI_ANALYTICS_rr-1` |
| D1 tables | `seasons`, `appearances`, `bonds` are keyed `(format, season_number)` |
| Ranking board | `rankings_rr.json` (Total Drama keeps `rankings_database.json`) |
| `seasons_database.json` | one row per season, carries `format` |
| `players_database.json` | `seasonDetails[].format` — **absent means Total Drama** |

That last one is the quiet trap: an appearance with no `format` is Total Drama,
so if your export forgets to stamp it, a racer joins the Total Drama career of
whoever shares their slug.

### Popularity, and the prize nobody votes on

`gs.popularity` is a running total your show increments as it goes — every
competition, every heroic or cowardly moment, every camp event. **Do not rank
players by it.** It is accrued per round, so it is dominated by how many rounds
somebody was in: measured on Big Brother 1 it correlates with FINAL PLACEMENT at
-0.952, which means asking it who was liked returns who lasted. Every consumer
that asked was reading the wrong thing — both shows' fan favourite award, the
heroes board, the "fan-loved" tag, the audience pulse, the social feed's crowd.

`js/audience.js` is the comparable reading, and it is show-agnostic on purpose:
it knows only that a show has rounds and eliminates people from them, both of
which it reads off `episodeHistory`. **A new show gets it for free and must not
write its own.**

| You want | Use |
|---|---|
| how much affection they generated all season | `gs.popularity[name]` |
| **who was liked more** | `audienceStanding(name)` |
| the whole cast, best first | `audienceBoard({ eligible })` |
| the award itself, as a vote | `runAudienceVote({ eligible, rng, blocks, scale })` |

Two knobs, both documented with the measurements behind them: `AUDIENCE_PRIOR`
stops a two-round cameo topping the board on one good moment, and
`VOTE_SHARPNESS` sets how hard the favourite is favoured. Pass `scale` and
`blocks` from whatever your show knows about how many people were watching.

The only part that is yours is the NAME: `words.audienceAward` in the registry
entry ("Fan Favorite", "America's Favourite Houseguest"). If your show has no
such award, leave it out and call nothing.

The board is the same trap one level up. A ranking is a position on a board and
a board ranks ONE show, because the scores are not comparable across shows —
`js/rankings-update.js` weights a veto differently from an immunity on purpose.
Big Brother 1 was applied into `rankings_database.json`, which declares itself
Total Drama's, and the result was seventeen houseguests sitting at ranks 13, 26
and 28 among contestants while every reader that checks `metadata.format`
correctly refused to show them — the site said "No Big Brother rankings yet"
about players that were in the file.

`js/ranking-boards.js` owns the mapping and every reader goes through it. A show
with no finished season has no board, and that is not an error: `loadRankingBoards()`
skips a 404 so a new show does not break the pages before it has been ranked.

---

## 9. The duplication you will hit

These files each hold their own copy of the show list. Every one of them is a
place a third show can be forgotten, and none of them will error — they will
just describe your show as Total Drama.

| File | Identifier | Kind |
|---|---|---|
| `player.html` | `SHOW_PREFIX` (~681), `NAMES` (~792), `ICONS` (~793), `SHOW_NAMES` (~909, ~918), and a literal `['total-drama', 'big-brother']` (~727) | identity |
| `js/wiki.js` | `SHOW_NAMES` (~25) | identity |
| `js/wiki-view.js` | `SHOW_META` — name, short, emoji, accent (~28) | identity + styling |
| `season_ref.html` | `SHOW_NAMES` (~320) | identity |
| `current-season.html` | `CS_SHOWS` prefix map (~870) | identity |
| `compare.html` | `CMP_SHOW_LABEL` (~832) | identity |
| `franchise.html` | `SHOW_LABEL` (~705) | identity |
| `js/alumni.js` | `_SHOW_NAMES` (~106) | identity |
| `js/social/adapter.js` | `SHOW_WORDS` (~40) | **vocabulary — leave it** |
| `worker/worker-season-live.js` | `SHOW_WORDS` fallback (~716) | **vocabulary — leave it** |
| `js/settings.js` | venue list per format (~26) | data, per show |
| `js/rankings-update.js` | per-format ranking config (~360) | data, per show |
| `js/quick-setup.js` | `CONFIG_SCOPE` + the show picker | data, per show |

Eight of those are pure identity — a name, an icon, a prefix — and belong in the
registry. The rest are per-show DATA and are right where they are: a show's
venues, its ranking weights, its vocabulary and its config scope are not
identity and do not collapse.

**Recommended before you start:** collapse the eight identity maps into
`js/shows.js` and import them. Roughly an hour, mechanical, and it converts
eight chances to forget your show into zero. Keep the vocabulary and per-show
data maps where they are.

---

## 10. The order to do it in

Each step leaves the site working.

1. **Registry entry** (§1). Nothing uses it yet; the switcher already lists it.
2. **Collapse the identity duplicates** (§9) while the new show is still a
   registry entry with no data — the diff is small and the failure mode is
   obvious.
3. **Setup scope map** (§3), so the show can be configured but not run.
4. **Engine** (§2) behind the runnable flag, dispatched in both places.
5. **Export** (§5) — reuse `weeks` or `votingHistory` if the format allows.
6. **Publish one season** end to end. The site now has real data to render.
7. **Screens** (§6), driven by that season rather than by imagination.
8. **Ratings signals** (§2.5) — after step 6, because the only way to wire them
   is to print them against a season that really happened.
9. **AI fills** (§7) last — they are the only step that costs money per run.

---

## 11. Guards worth adding on the way

The existing ones that will already catch you:

- `tests/format-scoped-config.test.js` — a control is shown only where the
  engine reads it
- `tests/show-switcher.test.js` — the switcher holds no show list
- `tests/season-format.test.js` — the export adapter matches the engine's shape
- `tests/wiki.test.js` — each show's article uses its own vocabulary
- `tests/ratings.test.js` — every registered show declares an `audience`
  overlay (§1), and the same week must not rate identically on two shows
- `tests/ratings-distribution.test.js` — re-measures the `CALIBRATION` bands
  against played seasons, so a signal that drifts out of the range the table
  claims fails loudly instead of quietly contributing a fraction of its weight
- `tests/bb-nomination-alliance.test.js` — the alliance ledger, the hold
  reading, consent stances, departures, replay agreement between the status
  screen and the panel, and that nothing leaves the panel unexplained
- `tests/bb-nomination-reasons.test.js` — a speech reads the relationship
  before the plan, and never claims knowledge the speaker does not have
- `tests/bb-love-triangle.test.js` — every triangle beat has a case in the
  house's own words, and the arc reaches its back half
- `tests/bb-showmance-rate.test.js` — the couple ceiling scales with the cast,
  counts only what formed in the house, and the archetype matters

**The vocabulary guard, added 2026-08-12** — the one this section used to say
was missing:

- `tests/show-vocabulary.test.js` (vitest, runs in `npm test`) walks **every
  registered format**, renders a character article for a winner *and* for
  somebody who was eliminated, runs the round ledger and the social vocabulary,
  and fails if a show's own output contains another show's words. A third show
  gets this coverage by existing in `js/shows.js` — there is no list in the test
  to remember to extend.
- `tests/e2e/show-pages.spec.js` does the same against **the site's real data**,
  on the season page, for one season per show that actually has rounds. It reads
  the whole wiki panel minus the AI-written nodes, so it cannot miss a place the
  page generates text.

Both were verified by putting the shipped bugs back and watching them fail —
which is the only way to know a guard works. Three things that made the first
versions pass over a page that was visibly wrong, all worth knowing before you
write the next guard:

1. **The fixture only rendered a winner**, so the exit cell — where "Evicted"
   appears — never drew.
2. **The season chosen had no round data**, so the section under test was empty.
   A guard that passes because there was nothing to check is worse than none.
3. **`` `${w}` `` in a template literal is a backspace character**, not a
   word boundary. The pattern matched nothing and the test passed against a page
   saying "was evicted" over a Total Drama season.

---

## 11.5 The bug classes, and what a third show inherits

Everything below was found by playing seasons and reading the output, not by
reading the code. They are grouped by the underlying mistake rather than by the
feature they happened to, because every one of them is reachable again the
moment a third show exists. The numbers are the measurements that found them.

### A. Written, run, and shown to nobody

The most common failure in this codebase by a distance. A system works, mutates
state every week, and reaches no screen — so it reads as "the simulator doesn't
do that" when the simulator has been doing it all along.

- **The love triangle.** Ran in a house all along: 7 formed across 110 weeks,
  both shapes, ~10 beats each. Only the OPENING beat had a case in the house's
  romance harvest, so the escalation, the schemer working it for votes, the
  public fight and the choice all fell through to a default that rewrites
  "camp" to "house" and leaves the rest — a Big Brother house was told somebody
  had been "carrying water together, sitting close at fire".
- **The veto's own reasoning.** `shouldUseVeto` returns a specific `why` for
  every branch — the tier of the deal, whether the replacement pool was down to
  one name. The screen read a table of three fixed sentences first and only
  fell through to it when the reason was missing from the table, which never
  happens. Computed weekly, printed never.
- **Two stores for one event.** An alliance can die in TWO places: the show's
  own `reconcileAlliances`, and the shared `decayAllianceTrust`, which writes to
  `gs.allianceDissolutions` and expels members into `gs._pendingExpulsions`.
  Both of those are drained by `episode.js` and `camp-events.js` — Total Drama
  files a house never calls. 15 alliances vanished between weeks with members
  still in the house; 5 had no explanation anywhere, all through that path, and
  the expulsion queue grew untouched for the whole season.
- **The ending nobody wrote.** 85% of love triangles end by one corner being
  voted out, and that ending produced no scene at all.

> **For a new show:** every store the shared Total Drama code writes to needs a
> consumer in YOUR engine, or it is a leak with no output. `gs._pendingDepartures`,
> `gs._pendingExpulsions` and `gs.allianceDissolutions` are the three known ones.
> Grep for what writes them and check who reads them under your format.

### B. A screen showing now instead of then

Any screen that can be reopened after the season has moved on must read the
episode's own snapshot. Reading live state is invisible while you watch a
season straight through and wrong the moment anybody reloads one episode.

- House Status built its alliance rows from `listBlocs()` — live. Replaying
  week 11 drew The Majority with the four members it ended up with while the
  panel beside it drew the two it was founded with. **25 of 25 alliances on
  replayed episodes disagreed with their own week**, most by not being drawn at
  all, because the live list is filtered to who is still in the house NOW.
- The hold readings under each face were recomputed at paint time, so a
  replayed episode explained its numbers with relationships that had not
  happened yet.
- **A stretch with no snapshot silently borrows a global one.** House Life
  panels read `act.state`; the campaign act had none, so that one screen fell
  back to the episode's end-of-week picture. Every visible mid-week alliance
  change landed on that single transition — screen 4 to screen 5.

> **For a new show:** if a screen has a "previous/next" control, it is a
> historical screen. Snapshot per stretch, not per episode, and make every panel
> read the same source.

### C. One show's words in another show's mouth

The reason this document exists (§0), and it survives in places the vocabulary
guard cannot see, because the guard walks generated articles and ledgers rather
than every beat pool.

- Triangle beats set on a beach: shelters, fires, fishing, reward feasts.
- The default rewrite maps `tribe`→`house` and `camp`→`house` and nothing else,
  so it launders the obvious words and passes the furniture through.

> **For a new show:** a `default:` branch that does string replacement is not
> coverage. Every event type that can fire under your format needs its own case,
> and the way to find the gaps is to dump a season's beats and read them.

### D. A character who knows more than they should

- The nomination speech announced an alliance the Head of Household had never
  noticed: it read `gs.namedAlliances` — the truth of the house — rather than
  the per-person knowledge layer the house has always tracked. **6 of 12 such
  speeches came from somebody whose knowledge of that group was zero.**
- The same speech read the *plan* (`intentions.revenge`) before any
  relationship, so a Head of Household told the person they were in a showmance
  with "this is personal, you know what you did".

> **For a new show:** anything a character SAYS must be sourced from what that
> character can see. Relationship before plan; knowledge before both.

### E. A mean that hides the event

`memberLoyalty` averages a member's bonds with everybody else in the group. The
most important thing that can happen inside an alliance — its own Head of
Household putting you on the block — lands on exactly one of those bonds. In a
seven-strong group a −1.4 hit moves the mean by −0.23, which the score
multiplies by 0.045: **a tenth of a point.** Measured, the person put up moved
−0.06 across the week and went UP as often as down.

> **For a new show:** if a displayed number is an average, ask what single event
> it is supposed to be able to show. Read those as events off a ledger.

### F. A constant written for a different shape of season

- The showmance cap was a flat 4 for any cast — so a house of 14 ran three
  couples while a 22-person beach cast ran the same number.
- The love triangle's phase clock was 3 episodes to escalate and 5 to the
  ultimatum, which assumes three specific people survive that long. A house
  evicts somebody weekly: mean triangle life 2.3 weeks, **55% never left the
  first phase and 10% ever reached the choice.**
- The `elsewhere` term in `memberLoyalty` subtracted the ABSOLUTE power of every
  other bloc from a score capped at 1.0, but power is `share × cohesion × size`.
  Being in more rooms emptied you: with three other blocs, **75% of members read
  exactly 0.0** — the value documented as "already gone in everything but the
  announcement".

> **For a new show:** every threshold and cap in shared code was calibrated
> against one show's episode count and cast size. Re-measure them under yours.

### G. The stat that turned out not to matter

- Alliance value in `bbHeat` was a flat term, so a loyalty-9 soldier and a
  loyalty-1 schemer priced the same alliance identically.
- The showmance first move needed spark intensity 0.5 for a showmancer against
  0.8 for everybody else — not a difference. A cast containing **no showmancer
  at all** still produced 31 showmances in 12 seasons.
- Additive terms lose to big piles. The file's own shield-discount comment says
  so; the fix is proportional discounting, scaled by the stat.

### H. Omniscience where the format has a conversation

Nominating a member of your own alliance was classified by whether the others
already happened to want them gone — because the house had no way to ASK. There
is a pawn conversation and nothing at all for "I need to put one of ours up", so
**47 of 74 ally-nominations came back as blindsiding the group**. Consent is a
scene, not a query.

### I. Timing: the week is not filed yet

Two of the same shape, and both returned a confident wrong answer:

- `gs.bb.weeks` only gets the week appended once it is OVER, so an entry written
  during the week in progress reads as one week in the FUTURE. A guard against
  negative ages threw it away and the consequence never appeared inside the week
  it happened.
- A romance stage notices an eviction the week AFTER it happens, when the
  current ballots are a fresh empty set — so "did the person in the middle write
  the name?" came back false every single time until it read the week that
  actually took them out.

### J. Guards that pass against the bug

Three ways a test has lied in this repo, all worth checking for in a new one:

1. **Asserting on presence in a whole page.** A replay test checked that the
   alliance's name and members appeared somewhere in the HTML — every houseguest
   is on that screen several times over. It passed against the bug. Read the
   value out of the specific row.
2. **Gating the check on data the probe cannot see.** A triangle probe counted
   transcript hits only when `ep.triangleEvents` was non-empty — a field that
   lives on an internal shim and is never returned. It could only ever report
   zero.
3. **Not verifying the guard fails.** Every fix in this session was checked by
   reverting the code and watching the test fail. 25 of 25, 6 of 12, 15 of 15 —
   the "before" number is the evidence the test works.

### What a third show inherits from this work

Wire these up rather than rebuilding them:

| Thing | Where | What it gives you |
|---|---|---|
| Per-stretch state snapshots | `_snapshotHouse(full, roster)` | panels that are correct on replay, and arrows that point at the cause |
| `withRoster(names, fn)` | `js/bb/blocs.js` | compute a board over a past roster without mutating live state — fixes the evictee-shaped hole that spoiled the vote |
| The alliance ledger | `alliance.history` | `nominated-own` with `target`, `consented` and `stance`; read by the reading, the speech and the screen |
| Consent stances | `week.allianceConsults` | signed off / never asked / told no and did it anyway, priced differently |
| Departures | `week.allianceExits` | quit, thrown out, and the concealed one that stays on the list |
| Dissolution reporting | `week.allianceDissolved`, `week.allianceDepartures` | nothing leaves the panel without a sentence |
| Life-layer carry | `brokenPairs` in `life-hook.js` | a break-up the audience watched ends the relationship in the log |

---

## 12. What will still be hardcoded when you are done

Being honest about the parts this document cannot make easy:

- **The engine is bespoke.** No amount of registry work writes your show's
  rounds for you.
- **`season_ref.html`'s Wiki tab** branches on round shape in six places. A
  third shape means editing all six.
- **VP screens** are per show by design — a Big Brother eviction night and a
  Total Drama tribal council do not share a screen, and should not.
- **The episode writer's prompt** is per show. Reusing another show's prompt
  produces episodes in that show's format.

Everything else is a registry entry and a vocabulary block.

---

## 13. Re-deriving every list in this document

Run these before trusting anything above. They are the searches the document was
built from, so a difference means the code moved and this file did not.

```bash
# Ignore vendored and worktree copies in all of these, or the counts inflate.
EX='node_modules|\.claude/'

# Everything that imports the registry (§1). Expect 23 non-test files.
grep -rln "shows\.js" --include=*.js --include=*.html .   | grep -Ev "$EX" | grep -v "^./tests" | sort

# Everything holding its own show map (§9). Expect the 13 files in that table;
# anything else is a new duplicate that will silently mis-label a third show.
grep -rn "'total-drama'" --include=*.html --include=*.js .   | grep -Ev "$EX" | grep -v "^./tests/"   | grep -E "\{ ?'total-drama'|'total-drama':" | grep -v "js/shows.js"   | awk -F: '{print $1}' | sort -u

# Every place the engine or a screen branches on a specific show (§2, §6).
grep -rn "big-brother" --include=*.js --include=*.html js/ *.html worker/   | grep -Ev "$EX"

# Which files carry the most branching — where a third show costs most.
grep -rc "big-brother" --include=*.js --include=*.html .   | grep -Ev "$EX" | grep -v "^./tests/" | grep -v ":0$"   | sort -t: -k2 -rn | head -20

# The guards that already enforce per-show correctness (§11).
ls tests | grep -E "format|show|season-format"
```

**Counts as of this writing:** 46 non-test files mention `big-brother`; the
heaviest are `js/core.js` (31 — the twist catalog), `js/quick-setup.js` (22),
`js/stats-export.js` (18), `js/bb/week.js` (16). The first and last are
expected — a catalog and a show's own engine. The middle two are the ones worth
watching: if they grow, per-show behaviour is leaking into shared code.
