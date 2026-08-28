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
35 modules already read it and need nothing from you, and everything
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
vocabulary. **Thirty-five** non-test files import it today, up from the
twenty-three this document was written against — the growth is the identity
collapse in §9 landing, and it is the number moving in the right direction:

`awards.html`, `compare.html`, `current-season.html`, `devotees.html`,
`franchise.html`, `js/alumni.js`, `js/core.js`, `js/episode-store.js`,
`js/episode.js`, `js/fame.js`, `js/finale.js`, `js/franchise-meta.js`,
`js/franchise-ui.js`, `js/kristal.js`, `js/quick-setup.js`,
`js/ranking-boards.js`, `js/rankings-update.js`, `js/ratings-backfill.js`,
`js/ratings.js`, `js/show-switcher.js`, `js/site-header.js`,
`js/social-page.js`, `js/social/adapter.js`, `js/stats-export.js`,
`js/wiki-fill-run.js`, `js/wiki-view.js`, `js/wiki.js`, `leaderboards.html`,
`player.html`, `rankings.html`, `season-awards_ref.html`, `season_ref.html`,
`seasons.html`, `timeline.html`, `worker/worker-studio.js`.

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
`exportSeason()` picks one on format. Yours REGISTERS one:
`registerSeasonExporter('your-slug', build)`, and `seasonExporterFor(format)`
looks it up. This used to be a single equality against the Big Brother slug, so
every other show — a third one included — was exported by Total Drama's
pipeline with no error and no empty result, just a season document in the wrong
show's shape. A show with no builder registered still falls back to the default
show, which is the bare-integer rule; register a builder that REFUSES if your
show cannot be exported yet, because being told nothing is recoverable and
being told the wrong show is not.

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

The Traitors is the worked example of reusing one. It has TWO votes a round —
the public banishment everybody casts and the private murder only the Traitors
cast — and it still exports ONE `votingHistory[]` row per round, with every
ballot carrying a `channel` (`banishment`, `banishment-revote`, `murder`). A
reader that wants the public vote filters the channel; a reader that has never
heard of channels sees a votingHistory row. See `js/tr/export.js`.

It is also the show that broke the one-exit-verb assumption: it BANISHES at the
table and MURDERS at night. A row may therefore carry `exits[]`, each entry
naming who left and the verb the REGISTRY gave that channel (`exitVerbs()` in
`js/shows.js`), and `roundLedger()` renders that list when it is there. If your
show has more than one way of removing somebody, declare the second verb in the
registry and put the departures on `exits[]` — do not let one of them be
printed in the other's words.

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
such award, leave it out and call nothing. The Traitors does exactly that.

**Your show has to WRITE `episodeHistory`, or none of the above works.** That is
the one thing `js/audience.js` needs from a format and the one thing a headless
season loop is most likely not to have: with no history, `roundsPresent` falls
back to the whole season for everybody and `audienceStanding` degrades into the
accrued total divided by a constant — the −0.952 bug restored under a new name,
passing every test you have. Write one row per round: `{ num, eliminated, exits }`.

**If your show has more than one way out, the second one goes on `exits[]`.**
`eliminated` is the VOTE — every existing reader of that field means the vote —
so The Traitors puts the banished there and the murdered on `exits`, which is
the §5 round shape anyway. Get this wrong and half your cast is credited with a
full season they did not play.

**If your audience knows something the cast does not, popularity has to say so.**
The Traitors' viewers have known who is in a cloak since night one, so a Traitor
playing brilliantly is *entertaining* and not *admirable*, and paying both into
one column turns `gs.popularity` into a competence score for whichever villain
the crowd enjoyed most. `js/tr/crowd.js` is the worked example: one colour table
with an `affection` number and a `spectacle` number, affection into
`gs.popularity` and spectacle into a second ledger, and positive affection damped
for anybody the audience knows is lying. Measured, a Faithful's heroism pays 27x
what a Traitor's best move does in affection, and about a quarter of it in
spectacle. **And nothing in the engine may read either ledger back** — they are
written from ground truth, so a read is alignment reaching the cast through a
side door.

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

**The eight identity maps in this table are gone.** They were collapsed into
`js/shows.js` on the Traitors branch (2026-08-25), which is why §1 now counts
thirty-five importers instead of twenty-three. The table is kept because the
identifiers are still the fastest way to understand what was there, and because
the row that says "leave it" is the one worth reading before you delete
anything: not every per-format map is a duplicate.

| File | Identifier | Kind | Status |
|---|---|---|---|
| `player.html` | `SHOW_PREFIX`, `NAMES`, `ICONS`, `SHOW_NAMES`, and a literal `['total-drama', 'big-brother']` | identity | **collapsed** |
| `js/wiki.js` | `SHOW_NAMES` | identity | **collapsed** |
| `js/wiki-view.js` | `SHOW_META` — name, short, emoji, accent | identity + styling | **collapsed** |
| `season_ref.html` | `SHOW_NAMES` | identity | **collapsed** |
| `current-season.html` | `CS_SHOWS` prefix map | identity | **collapsed** (reads `window.__SHOWS`) |
| `compare.html` | `CMP_SHOW_LABEL` | identity | **collapsed** |
| `franchise.html` | `SHOW_LABEL` | identity | **collapsed** |
| `js/alumni.js` | `_SHOW_NAMES` | identity | **collapsed** |
| `js/social/adapter.js` | `SHOW_WORDS` (~40) | **vocabulary — leave it** | stands |
| `js/social/adapter.js` | three ternaries in `eventLabel()` (~114–117) | identity leak | **not fixed — see below** |
| `worker/worker-season-live.js` | `SHOW_WORDS` fallback (~716) | **vocabulary — leave it** | stands |
| `js/settings.js` | venue list per format | data, per show | stands |
| `js/rankings-update.js` | per-format ranking config | data, per show | stands |
| `js/quick-setup.js` | `CONFIG_SCOPE` | data, per show | stands |
| `js/quick-setup.js` | the show picker cards | identity | **collapsed** (2026-08-25) |
| `js/player-trivia.js` | per-format trivia | data, per show | stands, never in this table |
| `js/ranking-boards.js` | format → board file | data, per show | stands, never in this table |
| `js/social-page.js` | `?show=` slug/prefix resolver (~95) | identity | **collapsed** (2026-08-27) |
| `tools/backfill-tiers.mjs` | `BOARD_FILES` copy | identity | **collapsed** (2026-08-27) |
| `tools/regen-rankings-reasoning.mjs` | `SHOW_NAMES` + label + fallback shape | identity | **collapsed** (2026-08-27) |

**There is a guard now: `tests/show-list-duplication.test.js`.** It states the
rule over every `.js`/`.mjs`/`.html` file in the tree rather than listing the
files above, so a NEW copy fails on the day it is written. The known-good
per-show DATA maps are named in it as exemptions with their reason, and the
nineteen surviving two-show ternaries are a ratchet: a file may lose one, never
gain one. That is the file to change when you find a shape neither grep catches
— add the shape, not the file.

Three things that table did not say when it was written, and all of them cost
time:

**The collapse missed a ninth list.** `js/quick-setup.js`'s show picker held
`{ id, name, tag, icon }` per show and was not in the table, so nobody looked at
it — and it had already drifted: Big Brother's icon was 🏠 there and 📹 in the
registry, so the same show wore two faces on two screens and nothing errored.
That is the whole failure mode in one line. It now derives `name` and `icon`
from the registry; `tag` stays local because a picker's sales copy is not
identity. Anything you find that is not in the table above is another one:
re-derive with §13 rather than trusting this list.

**`js/social/adapter.js` is BOTH.** `SHOW_WORDS` is genuine per-show vocabulary
and must stay. But `eventLabel()` (~114–117) decides three labels with
`format === 'big-brother' ? A : B`, so a third show is told it had a
"Challenge win" and an "Elimination" by fallthrough — identity smuggled in as a
ternary. It is deferred with the wiki-view screen work, not fixed, and the
reason it survived every audit is in §13: the duplicate-hunting grep matches
map shapes only, and a ternary has no braces in it.

**Both greps in §13 had blind spots that hid three more copies, and the guard
found all three.** They passed `--include=*.js --include=*.html`, so nothing
under `tools/` with an `.mjs` extension was ever searched — which is how
`tools/regen-rankings-reasoning.mjs` kept a `SHOW_NAMES` map, an
`startsWith('bb-')` format guess, an `S`-or-`BB` season label and an `/^(?:S|BB)/`
fallback shape, four show lists in five lines, in the file that writes the prose
the public ranking board displays. And the ternary grep is line-based, so the
six two-show ternaries written across two lines were invisible to it —
including `js/stats-export.js:2874`, which dispatches the ENTIRE season export
on `=== 'big-brother'`, and `js/social/live.js:30`, which picks which round
array to read the same way. Both send a third show down Total Drama's branch.
The `.mjs` copies are collapsed; the six ternaries are recorded in the guard's
backlog and still stand.

---

## 10. The order to do it in

Each step leaves the site working.

1. **Registry entry** (§1). Nothing uses it yet; the switcher already lists it.
2. **Collapse any identity duplicate you find** (§9) while the new show is
   still a registry entry with no data — the diff is small and the failure mode
   is obvious. The eight in the table are already done; run §13's two greps to
   find the ones that appeared since.
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
- `tests/show-list-duplication.test.js` — **NO file holds a show list**, stated
  as a rule over the whole tree rather than a list of the known offenders (§9),
  because a list-shaped version of this guard would have passed the day the
  ninth copy appeared, and it did appear. Per-show DATA maps are exemptions
  carrying their reason; the surviving two-show ternaries are a ratchet
- `tests/season-format.test.js` — the export adapter matches the engine's shape
- `tests/wiki.test.js` — each show's article uses its own vocabulary
- `tests/ratings.test.js` — every registered show declares an `audience`
  overlay (§1), and the same week must not rate identically on two shows
- `tests/ratings-distribution.test.js` — re-measures the `CALIBRATION` bands
  against played seasons, so a signal that drifts out of the range the table
  claims fails loudly instead of quietly contributing a fraction of its weight

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

# Everything that imports the registry (§1). Expect 36 lines — 35 non-test
# files plus js/shows.js itself.
grep -rln "shows\.js" --include=*.js --include=*.html .   | grep -Ev "$EX" | grep -v "^./tests" | sort

# MAP-SHAPED duplicates (§9). Expect exactly these 7 files, all of them per-show
# DATA that is right where it is:
#   js/player-trivia.js  js/quick-setup.js  js/ranking-boards.js
#   js/rankings-update.js  js/settings.js  js/social/adapter.js
#   worker/worker-season-live.js
# Anything else is a new duplicate that will silently mis-label a third show.
# Two of those seven — js/player-trivia.js and js/ranking-boards.js — were
# never in §9's table at all, which is the point of running the command.
grep -rn "'total-drama'" --include=*.html --include=*.js .   | grep -Ev "$EX" | grep -v "^./tests/"   | grep -E "\{ ?'total-drama'|'total-drama':" | grep -v "js/shows.js"   | awk -F: '{print $1}' | sort -u

# TERNARY-SHAPED duplicates. ONE GREP IS NOT ENOUGH: the command above matches
# an object literal keyed by slug, and a show list hidden in
# `x === 'big-brother' ? A : B` has no braces and no colon-after-slug, so it is
# invisible to it. Every such ternary is a two-show world that calls a third
# show by the default show's name — which is exactly how js/social/session.js
# came to generate an entire season's social feed in Total Drama's words while
# passing every audit in this document. Expect 13 hits across 7 files:
#   js/wiki-view.js (4)  js/social/adapter.js (3)  js/cast-ui.js (2)
#   js/run-ui.js  js/social/events.js  player.html  worker/worker-season-live.js
grep -rn "=== 'big-brother' ?" --include=*.js --include=*.html .   | grep -Ev "$EX" | grep -v "^./tests/"

# Neither grep is exhaustive. `!== 'big-brother'`, `?? 'total-drama'` and a
# switch on the slug are all show lists too. Treat these two as the floor.
#
# AND RUN THE GUARD, WHICH IS STRICTLY STRONGER THAN BOTH:
#     npx vitest run tests/show-list-duplication.test.js
# It walks .mjs as well as .js/.html and matches across line breaks, which is
# how it found three copies and six ternaries neither command above can see —
# both greps were, in the end, list-shaped about extensions and line-shaped
# about ternaries. Keep the greps for reading; trust the guard for counting.

# Every place the engine or a screen branches on a specific show (§2, §6).
grep -rn "big-brother" --include=*.js --include=*.html js/ *.html worker/   | grep -Ev "$EX"

# Which files carry the most branching — where a third show costs most.
grep -rc "big-brother" --include=*.js --include=*.html .   | grep -Ev "$EX" | grep -v "^./tests/" | grep -v ":0$"   | sort -t: -k2 -rn | head -20

# The guards that already enforce per-show correctness (§11).
ls tests | grep -E "format|show|season-format"
```

**Counts, re-derived 2026-08-25 on the Traitors branch:** 47 non-test files
mention `big-brother`; the heaviest are `js/core.js` (35 — the twist catalog),
`js/quick-setup.js` (22), `js/stats-export.js` (21), `js/bb/week.js` (16). The
first and last are expected — a catalog and a show's own engine.

The two this document told you to watch **both grew unnoticed**: `js/core.js`
31 → 35 and `js/stats-export.js` 18 → 21, between Big Brother shipping and a
third show being registered, with nothing reporting it. The instruction to watch
them is only worth as much as the re-run, so re-run the command and write the
new number into this paragraph in the same commit — that is what makes the next
reader's comparison mean anything.

(46 → 47 rather than 48: `js/social/session.js` dropped off the list when its
two-way `=== 'big-brother'` ternary was replaced with `seasonFormat()`, and
`js/quick-setup.js` joined §1's importer list when its picker started reading
the registry. A count going DOWN here is usually a duplicate being removed.)
