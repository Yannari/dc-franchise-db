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
- `airNight` and `airSlots` put the show on the franchise calendar: which
  night of the week it goes out on, and which quarters of the year it airs in.
  Both are required, and a test fails without them — see §5.1.

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

**It happened to four more shows at once.** The Traitors, The Challenge,
Ridonculous Race and The Circle each shipped with no reader of their own. The
first three fell into the vote reader, and the race into the runway reader,
because the race declares `roundShape: 'placements'`. Neither found anything,
so every signal read zero. Measured on The Circle (2026-10-22), every seed rated
46.1 "Okay", the same number to the decimal. None of the four exporters even
stored the rating, so nobody saw it.

**The fix is a reader per show, named in the registry.** `SHOWS[slug].signals`
names it (`'villa'`, `'castle'`, `'challenge'`, `'race'`, `'circle'`), and
`readSignals` dispatches on that name BEFORE the round-shape check. A show's
round shape decides how its rounds are exported, not where its drama is
recorded. The four newer readers live in `js/ratings-shows.js`; Perfect Match's
`readVillaSignals` and Drag Race's `readPlacementSignals` are in `js/ratings.js`.

**So, for your show:**

1. **Dump a played season's rows first, built by the same function your run
   file uses** (`challengeRows`, `raceRows`, the castle's `episodeHistory`).
   A headless season that never calls the run file's builder has no rows at
   all. The first probe of The Challenge and the Race read `rows: 0` and
   rated nothing. Print the top-level keys, your block's keys and a count of
   every aired event KIND.
2. **Write a reader that keeps each signal's MEANING and changes only its
   source.** Read the show's own kinds, because those are its words: a
   traitor caught at the table, an Arena upset against the power rankings, a
   team that led last leg going home on this one. Each of the four newer
   readers says at the top what each signal reads. A signal the format
   genuinely lacks is an honest zero, said out loud in a comment (a race has
   no returns: its boomerang is a penalty).
3. **Size each count to the show's volume.** A villa airs ~100 scenes a night,
   a race leg 60-180 segments, and a Circle day 20-35 scenes of several
   blocks each. A span copied from another show pins the signal at the top
   of its band. The Circle's first pass rated 68 "Great" on every seed
   because strategy, showmance and villainy all saturated.
4. Declare `audience` in the registry (§1). Without it your show is rated as
   generic reality television — the base table, no overlay. That is a
   deliberate neutral fallback rather than inheriting Total Drama's, which
   would rate your show as though it were a different one.
5. **Add your show to `tests/ratings-shows.test.js`.** It asks every reader the
   same three questions:
   - Does every signal stay inside its `CALIBRATION` band?
   - Does every signal move? (p90 above 15% of the band, p50 below its top,
     and a real spread.)
   - Do different seasons rate differently? This is the check that catches a
     flat constant.

   Use four seasons, not one, and give twists a season that books some. A
   plain Challenge season books none, so its twist signal is an honest zero
   on it.
6. **Store the rating at export.** Call `_rateSeason(doc, rows, FORMAT)` in
   your exporter (`js/stats-export.js`); it stores `publishedRatings()`. Total
   Drama and Big Brother compute theirs inline (`_extractRatings`), and every
   exporter registered after them forgot to. That is §11.5 Q, the second copy
   missing the hard-won part.

**Why the rating matters beyond the badge: it moves followers.** Dramagram
(`js/dramagram.js`) scales a person's debut, placement bonus and fan-favourite
payment by the season's REACH. A Dogwater season pays 0.6x and an Iconic one
1.32x. A season with no rating pays a flat 1x, which is the same for every
season of the show. A missing rating is not neutral: it erases the difference
between the season everybody watched and the one nobody did.

**A show that counts its own following.** Perfect Match's public ledger keeps a
follower number all season: fame from every aired scene, scaled by approval
(`js/pm/ledger.js followers()`). The exporter publishes it on each islander's
season (`pm.followers`), and Dramagram adds it as a "followed on air" step.
That step is converted at `FOLLOWERS.onAir` (0.25) and scaled by reach. The
conversion exists because the two scales differ by ~15x: the median islander
ended on ~180k and the best on ~660k, against a 12k debut and a 120k win. Taken
raw, an ordinary islander would outrank every other show's winner. If your show
keeps a following too, publish it on the placement under your prefix and give
it the same conversion. `tests/pm-dramagram-followers.test.js` is the worked
example: play, build the document, merge it into both databases, then read
every islander's history.

A trap in that test: a season merged into an EMPTY database gets no
`airYear`/`airSlot` (there is no calendar to place it after), and Dramagram only
counts a season that aired. Every total came back 0 until the test gave the
season a summer.

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
| `ratings` (via `_rateSeason`) | the seasons page's tier badge, and Dramagram's reach multiplier on every cast member's followers (§2.5). Missing = a flat 1x for every season |
| a per-round array | **the shape decision below** |

And on each placement row, for the readers that are not the season page (The
Challenge's exporter, `js/ch/export.js`, is the worked example and
`tests/ch-export.test.js` checks every one):

| Field | Who reads it |
|---|---|
| placements **taken from your ledger record** | `legacy-canon.js` rebuilds any record whose placements differ from the document, which throws away its allies, showmances and betrayals |
| a standard ranking: everybody at place p has p-1 people ahead | the record book and Legacy. Two champions at 1st make the next player 3rd; The Challenge numbered them from 2 and no season had a 6th |
| `alliances`, `rivalries`, `unbreakableBonds` | the life layer's social graph; `unbreakableBonds` fills D1's `bonds` table |
| `showmance`, `showmanceEnded` (`'intact'`/`'broken'`) | the life layer: who walked out together, and who cheated on a partner at home |
| `showmanceStrength` (0..1) | `life-resolver.js showmanceRate`: a strong showmance is likelier to last outside. Without it the flat 0.75 applies |
| your `careerStats` paths (`ch.dailyWins`) | the record book, the rankings board and the published ledger's `stats` |

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

### 5.1 The franchise calendar — when the show airs

Every season sits on one calendar: a year plus a quarter (`airYear`, `airSlot`
of `winter`/`spring`/`summer`/`fall`) on its row in `seasons_database.json`,
and nowhere else. `js/franchise-calendar.js` turns that into everything
time-shaped on the site: episode airdates in the wiki, a player's age on a
given season, "the first player to…" across shows, the site header's
"NOW · WINTER 2027", and the **Franchise Calendar** tab on `timeline.html`
(`timeline.html#calendar`, drawn by `js/calendar-view.js`).

**What a new show gets for free.** The calendar view reads `SHOWS` and nothing
else, so with only the registry entry your show has its own row, in its
`accent` with its `emoji` and `short` label, and a dashed **projected** bar
for its first season in its first home quarter. Nothing in `calendar-view.js`
names a show and nothing there needs editing.

**What you must do — two things:**

1. **Give it `airNight` and `airSlots` in the registry.** The schedule agreed
   on 2026-10-17 is two shows a quarter, never two on one night:

   | Quarter | Shows (night) |
   |---|---|
   | winter (Jan–Mar) | Drag Race (Fri) · The Traitors (Thu) |
   | spring (Apr–Jun) | Total Drama (Mon) · The Circle (Wed) |
   | summer (Jul–Sep) | Big Brother (Wed) · Perfect Match (Sat) |
   | fall (Oct–Dec) | Total Drama (Mon) · The Challenge (Tue) · The Ridonculous Race (Wed, the third show of the quarter, chosen with the user) |

   Pick the quarter the real show airs in, and a night nobody else in that
   quarter uses. `tests/franchise-calendar.test.js` ("home quarters") fails
   when a show has no `airSlots` or two shows in one quarter share a night, so
   adding the show forces the decision instead of leaving a gap. A third show in
   a quarter is allowed, but it is a choice to make with the user, not a
   default — update this table when it happens. Without `airSlots`, the show's
   first season would be dated "one quarter after whatever aired last", and
   every season after it would continue that accident.

2. **Stamp the window in your exporter.** Your season builder (§5) reads
   `const airWindow = _airWindowFor(db, YOUR_FORMAT, seasonNum)` BEFORE
   filtering the old row out, and spreads `...airWindow` into the new
   `seasons_database` row. Every registered exporter does this; copy any of
   them. `_airWindowFor` honours, in order: the air-window dropdown in the
   season setup (how you move one season by hand), the window a previous export
   already wrote (re-exporting never moves a season), the window the season
   fixed when it STARTED (`gs.airWindow`, stamped by `saveGameState` through
   `js/air-watch.js`), then `nextWindowFor`: the show's next home quarter after
   its last season, or for a first season, its first home quarter at or after
   the latest aired, and in both cases never premiering before "now" (the
   latest FINALE, 2026-10-20). Because that makes export order matter, the Run
   tab warns (`#air-watch`) and the export asks when another show's season
   premieres while this one airs and has not started. `booked` on a show's
   registry entry is the one-time 2027 exception. **Forget the spread and
   the season is undated:** it drops off the calendar, sorts last in every
   cross-show ordering, and has no age for anyone in it, with no error
   anywhere.

The Circle was the last show without an exporter. Its exporter
(`js/ci/export.js` + `exportCircleSeason`, 2026-10-17) stamps the window like
the rest, so its first export lands in spring.

**Check it:** open `timeline.html#calendar`, find the show's row, and click
its projected bar. The card says which quarters the show airs in and where its
first season will land. After the first export the bar turns solid, with
real dates and the winner.

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
| Social feed | `js/social/adapter.js` | one `SHOW_WORDS` entry — including `nominationLabel` and `polls`, which the labels and the poll list are built from; **components never branch, so this is the only file** |
| Player profile | `player.html` | four separate name/icon maps (see §9) |
| Run tab / timeline | `js/run-ui.js` | badges, the hub, the episode list |
| Viewing party | `js/vp-screens.js` | screens filter `episodeHistory` on `format` |
| Rankings, awards, franchise, compare, leaderboards | those `.html` files | most already read the registry; `compare.html` and `franchise.html` hold their own label maps |
| Portraits, everywhere | `js/avatar-registry.js` | nothing to add for a new show — but see **Portraits** below before drawing a face anywhere |
| Casting Studio | `js/studio.js` | nothing to add — the Portraits panel builds its show dropdown from `SHOWS`. Check it lists your show; if it does not, the registry entry is wrong |

**The trivia trap, twice now:** a line that reads correctly on one show is a
false statement on another. "Reached the end without ever being nominated"
printed over a Total Drama season, which has no nominations; "was evicted"
printed over a camp, which votes people out. Every sentence a screen generates
has to come from that show's own vocabulary, and the registry's `words` block is
where it comes from.

---

### Portraits

A new show needs **no avatar code branch**. The moment its key exists in
`js/shows.js` it is a valid `show` value in
`assets/avatars/portrait-catalog.json` and appears in the cast builder's
portrait filter automatically.

To give somebody a look for the new show, use the Casting Studio: open the
character, **Portraits → Add portrait**, choose the new show in the dropdown
(it is there the moment the registry entry exists — the dropdown is built from
`SHOWS`, not from a list of its own), set the image and a label, and save. The
Studio writes the file and the catalog entry together, because art on disk that
no season can pick is invisible and unexplained.

By hand, the same three things:

1. put the file in `assets/avatars/`;
2. add one entry to that player's `portraits` array — a stable `id`, the new
   show's registry key, a human `label`, and the filename;
3. run `npm run avatars:files`, which regenerates the file inventory and
   validates the catalog.

Two rules the Studio and `serve.py` both enforce, because a portrait id is what
a season writes into its own history:

- **the file behind a registered id never changes.** Swapping it rewrites what
  every season that recorded it already drew, so it is refused; make a new id.
- **an id a saved season recorded cannot be unregistered.** `catalog_refs()` in
  `serve.py` and `collectHistoricalRefs()` in `tools/gen-avatar-manifest.mjs`
  both scan `data/seasons/` for this.

A label is free to change at any time: nothing keys off it.

`js/avatar-registry.js` is the only file allowed to turn a player plus a show
plus a stored selection into a URL, and `tests/no-direct-avatar-paths.test.js`
fails the build if a screen rebuilds one from a slug. An **unknown** show key
resolves to the player's global portrait and never borrows Total Drama's —
same rule as the vocabulary, applied to pictures.

**Never select artwork from `isReturnee`.** Returning is a fact about an
appearance; it has chosen no picture since 2026-09. The portrait a season uses
is recorded on the cast member as `{ avatarId, avatarFile }` and travels with
the season into saves, exports and the wiki.

---

## 6.5 Staging a screen: the pinned stage

This is how every Drag Race viewing-party screen was rebuilt in 2026-09, after
the verdict on the old ones was "visually boring, no suspense, no tension, no
wow, no animated card". The owner's words on the result: "it's so good I want
it everywhere". **Build a new show's screens this way from day one.** A column
of text cards is a transcript, not a show.

### The idea in one paragraph

Above the cards sits a **stage**: a picture of the room the scene happens in,
pinned to the top of the screen while the cards scroll underneath. Every reveal
click **plays** on that stage. The spotlight swings to whoever the card is
about. Faces light up or go dark, and meters fill. A banner slams in for the big
moment, confetti bursts for a win and the stage shakes for a disaster. A
confessional cuts away to one face talking to camera. The cards still carry
every word, so the stage is the *show* and the cards are the *script*.

### The architecture: one state per step

Every stage is a function that takes the screen's own step list and returns
`{ html, apply, states }`:

```js
export function thingStage(row, list, { ep, uid }) {
  // 1. ONE STATE PER STEP, built once from the data, never from the DOM.
  const states = list.map(s => ({
    phase: 'song',                       // drives CSS: data-phase="..."
    on: s.who,                           // who is lit
    mood: s.good ? 'gold' : 'red',       // background wash
    banner: s.big ? { text: 'Serving', sub: s.who } : null,
    burst: s.big, stars: false, shake: !s.good,
    quote: '',                           // html for a cut to camera
  }));
  // 2. THE MARKUP AT REST: everything the stage will ever show, unlit.
  const html = shell({ id: `thx-${uid}`, title, sub, body, theme: 'stage' });
  // 3. APPLY(idx): paint state idx onto the DOM. Idempotent, whole-state.
  const apply = engine(`thx-${uid}`, states, (el, st, fresh) => { /* own objects */ });
  return { html, apply, states };
}
```

The screen builder makes the SAME step list it makes its cards from, so card
`i` and state `i` are always the same moment. Then it wires the stage in:

```js
const stage = thingStage(row, list, { ep, uid: `t${ep.num}` });
wireStage('suffix', stage, ep, _state);   // _drRevealExtra[suffix] + repaint after re-render
return `<style>${KIT_CSS}</style>${_shell(`${stage.html}<div class="fsx-cards">${cards}</div>`, ep, {...})}
  ${_controls('suffix', list.length, ep.num)}`;
```

Rules that make this robust:

- **`apply(idx)` paints the WHOLE state every time.** It never patches the
  newest change. That is what survives a tab switch, "Reveal all", and a
  re-render (`wireStage` re-applies the saved `_state(ep, suffix).idx` after the
  screen repaints).
- **`fresh` is `idx === previous + 1`.** One-shot effects (burst, shake, stamp
  slam, banner animation) play only on a fresh step, never when you jump.
- **One step list feeds the cards, the rail and the stage.** The call screen's
  rail used to count names while the cards counted names plus the host's pause,
  so after the pause everything ran one step ahead.
- **Wrap the stage in `<!--dr-chrome-->…<!--/dr-chrome-->`** so the text
  transcript skips it; the cards already carry the words.

### The kit (`js/vp-dr/finale-stage.js`)

The frame is shared. Do not rebuild it per screen.

| Piece | What it does |
|---|---|
| `shell({ id, title, sub, body, theme, hostChip })` | background layers (rays, haze, colour wash, vignette), title, **headline pill**, host chip, banner, confetti, stars and the cut-to-camera overlay |
| `engine(id, states, paint)` | the shared `apply`: phase, mood, host glow, quote overlay, banner plus pill, burst/stars/shake on fresh steps, then your `paint` |
| `face(name, ep, size)` | a round portrait that sizes to its box |
| `quoteHtml({ name, label, text })` | a confessional or speech: tilted portrait frame and a quote card |
| `confetti(n, seed)` | particles with a **seeded** spread, so a re-render draws the same burst |
| themes | gold (default, the finale), `stage` (pink, main stage), `werk` (cyan grid, work rooms, out-of-drag host), `lounge` (purple, Untucked and the reunion) |

The stages built on it:

- `night-stage.js`: main stage, runway, critiques.
- `room-stage.js`: werk room, Untucked, prep/booth/rehearsal/set, every generic section, the sashay.
- `chal-stage.js`: mini, brief, draft, maxi.
- The finale's own stages in the kit file itself.

Older self-contained stages follow the same pattern: `call-stage.js`, `lipsync-stage.js` and `save.js`.

### The visual vocabulary (what we reach for, and where it worked)

Build the screen out of **what the moment IS**: a catwalk for a runway, a desk
for a panel, a corridor for a goodbye.

- **Spotlights.** Each queen gets a lit cone (`clip-path` trapezoid plus
  gradient). The current one is fully lit, the others dim
  (`filter: brightness(.5)`). A free spotlight **swings** to the called queen
  (`left` transition), or **hunts** back and forth over the ones still waiting
  during a pause (keyframed `translateX(±var(--hunt))`, width computed from the
  waiting faces).
- **Heartbeat pause.** `[data-phase=hold]` pulses the vignette in a
  double-beat keyframe. Used for the host's pause, the envelope and the cut.
- **3D floors.** A catwalk or corridor is a striped div with
  `perspective` on the parent and `transform: rotateX(62deg)` on the floor.
  Walking away is `translateY` plus `scale` down toward a lit door.
- **Meters and tug-of-war.** A width set from a CSS var (`--w`) with a springy
  transition. A tug-of-war is a knob whose `left` is the score difference,
  clamped. At the verdict it follows the FINAL score, or it can point at the
  loser.
- **Stamps.** Big bordered words (`WINNER`, `SASHAY`, `CUT`, `4th`) that
  **slam** in: start at `scale(2.6)`, opacity 0, rotated, then animate to
  scale 1.
- **Banners plus a headline pill.** The big banner plays for about 2.6s and
  fades so it never covers the faces. The same words stay in a pill in the
  stage header until the next click. (A banner that stays up hides the line; a
  banner that vanishes is gone before it is read.)
- **Particles.** Confetti rectangles and star shapes (`clip-path` star) with
  per-particle `--x --y --r --t --dl` from the seeded spread. They animate
  **only under the class that fires them** (`.burst`, `.flash`).
- **Cut to camera.** `[data-phase=quote]` greys the stage
  (`grayscale(1) brightness(.4)`) and brings in a tilted portrait frame with a
  quote card.
- **Relationship lines.** An SVG path between two faces that **draws itself**
  (`stroke-dashoffset` from its length to 0). Green is warm, a jittering red
  dash is cold, and the change is printed on it.
- **SVG objects, never CSS art.** Crown, trophy, envelope (the flap flips open
  with `scaleY(-1)`, the card slides up), sash, podium, chair, music note,
  chocolate bar, dunk tank. CSS is for lights, bars and particles only.
- **Theatre business.** Curtains that part (`translateX`), a marquee of
  alternating bulbs (`steps(2)`), photographer pits that flash for a big look,
  plinths that go dark from the bottom up, a crown that **drops** onto the
  winner (translate from the centre to her), a card that **flips** in
  (`rotateY(90deg)` to none), and faces that **flood** in with a staggered
  `--dl`.
- **Moods.** `data-mood="gold|red|cool"` swaps the colour wash: gold for a
  win or a rave, red for a flop, a fight or a cut.

### The rules (each one was a real bug)

1. **Always sticky, compact on short windows, and the compact block goes LAST
   in the CSS.** `position: sticky; top: 6px` always, then
   `@media (max-height: 999px) { …smaller faces… }` at the very end of the
   string. Put the media block before the base rules and the base rules win,
   so it silently does nothing.
2. **Reserve the room the stage takes.** The cards get
   `scroll-margin-top` about the stage's height (smaller inside the compact
   block), or the reveal scrolls the newest card under the stage.
3. **A stage may never set the page width.** Every stage root gets
   `contain: inline-size; min-width: 0; max-width: 100%`. One `nowrap` scene
   note once widened the whole content column and pushed the cards and the rail
   off the screen after a single click. Clamp long text with
   `-webkit-line-clamp`, never with `nowrap`.
4. **The overlay trap.** A rule like `.stage > *:not(.bg){position:relative}`
   overrides your absolutely positioned overlays (banner, confetti,
   confessional). Name them again with higher specificity:
   `.stage > .banner{position:absolute}`.
5. **Particles animate only when fired.** Confetti whose animation runs at
   load, invisibly, has already landed when the name is read.
6. **Cut long quotes at a word, with an ellipsis.** The full text is on the
   card. `slice(0, n)` printed "she doe".
7. **Reduced motion.** `@media (prefers-reduced-motion: reduce)` turns off
   every animation and shows the end states: stamps visible, banners hidden,
   bars at their widths.
8. **Phones.** At 400px the stage must still fit: smaller faces, hidden
   secondary labels, the headline pill on its own row. Check the page
   `scrollWidth` is not wider than the window.

### The spoiler rules (the stage is on screen before anything is clicked)

- **At rest, nothing is lit, stamped, placed or scored.** Tests read the
  stage markup the way a viewer opens it (`tests/dr-vp-spoilers.test.js`,
  `tests/dr-finale-stages.test.js`).
- **Lines are alphabetical** (or in the panel's order, which was already
  shown), never in finishing order. The same goes for the rail.
- **A line of faces on a screen whose result is a queen has no names in its
  text** (the mini). The face's `title` carries the name.
- **Scores and verdicts are written in when reached** (`data-v`, filled by
  `apply`), not sitting in hidden markup.
- **A bracket shows `? vs ?`** until that round starts. The final's pairing
  would print the semi-final results.
- **The room is the room at the START of the night** (`houseAtStart` /
  `roomAtStart`), never `living`, which already lacks tonight's elimination.
- **Separate names in the markup** (a space between stations). The
  whole-word spoiler guard cannot find `Q12` in `Q11Q12Q4`.
- **Engine data only.** The stage reads the scene's `data` (tier, score,
  bond, round) and never decides anything the chart does not say.

### How to check a stage

Unit tests prove the step ids, the counts and the spoilers. They cannot tell
you it looks good. For every stage:

1. Write a throwaway preview page (`zz-*-preview.html`, deleted before the
   commit) that plays a season and renders one screen, with
   `window.step = k => drRevealNext(...)`.
2. In Playwright, step to the interesting moments (the first card, a big
   moment, a confessional, the verdict) and **look at the screenshots**. Almost
   every fix in this section was found that way: an overlapping bubble, a
   banner over the faces, a sash spilling out of its plinth, a crown sitting on
   its own stamp.
3. Check three sizes: 1100×900, about 946×720 (the compact block), and
   400×800 (a phone). Check `document.documentElement.scrollWidth` does not grow
   as you click.
4. Put a stage guard test beside it: one stage, card ids 0…n-1, the controls
   total equals the card count, every written line is drawn, and nothing is
   marked at rest.

---

## 6.6 Music and sound

Every show with a stepped viewer keeps a **music list** in `docs/<show>-music.md`:
one row per part of the game, with the file name, when it plays, and what it
should sound like. Its sound module checks every file it names against that
list. The lists so far:

| Show | List | Sound module |
|---|---|---|
| The Circle | `docs/the-circle-music.md` | `js/vp-ci/sound.js` |
| Big Brother | `docs/bb-music.md` | `js/vp-bb-ep/sound.js` (Phase 3) |
| Perfect Match | (no list: hand-written manifest) | `js/vp-pm/sound.js` |
| The Traitors | (no list) | `js/vp-tr/sfx.js` |
| The Challenge | `docs/ch-music.md` (made by `tools/ch-make-audio.py`) | `js/vp-ch-ep/sound.js` |

The rules every show shares:

- **Beds** loop under a screen, **stingers** mark a moment. A missing bed plays
  silence, and a missing stinger plays a synth stand-in, so the show has sound
  from day one.
- **When** is read off the step being painted, never kept as a second list, so
  a step cannot sound like something that is not on screen.
- Only a click plays a stinger. Reveal all is silent.
- Levels are **measured, not judged by ear**: beds at -17 dB and stingers at
  -14 dB, re-encoded, with a per-file `lift` for a track that would clip.
- Write the list from the real show: what each part of the night sounds like
  on air, in search words someone can type into a music library.

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

### 8.1 A per-show player field has NINE links, and eight of them look fine

Your show will want player data the other shows do not have. Drag Race has
`drag` — seven craft numbers, a style, traits and a persona voice. Big Brother
will want aptitudes. Every one of these has to survive the same chain, and it
is much longer than it looks. Nine links, and the field is invisible if any one
of them is missing:

| # | Link | Where | How it fails |
|---|---|---|---|
| 1 | The **D1 column** | `worker/*_migration.sql` | written, never applied |
| 2 | The **worker** reads and writes it | `ROSTER_FIELDS`, the INSERT, the row reader | written, never **deployed** |
| 2b | The **local server** does the same | `serve.py` `ROSTER_FIELDS` | the OTHER writer, and it is a separate implementation |
| 3 | The **client sends it** | `_rosterPush` | a `_hasDrag`-style gate says there is nothing to send |
| 4 | The **offline draft keeps it** | IndexedDB `characters` | the rich record lists fields by hand and yours is not on it |
| 5 | The **pull does not delete it** | `_rosterPull` | the local roster is replaced wholesale by a server copy that lacks the field |
| 6 | The **publish carries it** | `franchise_roster.json` | the file is regenerated from D1 and drops what D1 does not have |
| 7 | The **roster allowlist knows it** | `tests/roster-bio-fields.test.js` | a correct publish is reported as a stray key |
| 8 | The **browser cache merges it** | `js/run-ui.js` | a stale local row replaces the fresh published one WHOLE |
| 9 | The **cast is not a stale copy** | `localStorage['simulator_cast']` | a cast record is a SNAPSHOT of the roster row, taken the day it was added |

**Link 9 is the one that will waste your afternoon.** The other eight are about
the roster; this one is about the fact that nothing reads the roster at run
time. `players` is a copy, taken once, and the engine and the cast builder both
read the copy. A cast assembled before your field existed carries none of it,
and the roster can be perfect — published, live, verified with `curl` — while
every screen still shows the default. Backfill it from the roster on load,
where the cast has nothing, and let anything edited on the cast form win.

Drag Race shipped with 1, 3 and 6 correct and **4, 5, 7, 8 and 9 wrong**, and
the worker at 2 was committed but never deployed. The result: an author set craft
on a dozen queens, the Studio showed it, and every value was silently gone by
the next page load. Nothing errored. No screen said anything. The engine then
scored a whole season on seven flat fives, which is why every lip sync in that
season was a coin toss.

**Link 5 is the one to build first, because it is the only one that destroys
data rather than failing to save it.** A server response that does not carry a
field must never be able to delete that field locally — merge onto what is
already there, and let the server own the LIST of players but not the set of
columns:

```js
const prev = new Map(local.map(p => [p.slug || p.name, p]));
persist(fromServer.map(p => {
  const was = prev.get(p.slug || p.name);
  return was ? { ...was, ...p } : p;   // server wins per field, never per record
}));
```

This is the same failure as the roster publish that ate researched demographics
twice. One defence, in the one place both paths go through.

**THERE ARE TWO SERVERS AND THEY ARE DIFFERENT PROGRAMS.** `serve.py` is a
Python process on a laptop writing straight into the working tree; the worker
is Cloudflare's, serving a static site and writing through the GitHub Contents
API. Same endpoints, same payloads, two implementations — and that is exactly
how one of them went months without portrait support while the other had it.
The failure mode is specific and quiet: the client posts a field, the runtime
that does not implement it ignores it and still answers `ok: true`, so the UI
reports success and the author finds out weeks later. **Anything you add to one
must be added to the other in the same change, and a source guard should assert
both.** `tests/dr-studio-drag.test.js` and `tests/studio-portraits.test.js`
both read `serve.py` and `worker/worker-studio.js` for exactly this reason.

The honest fix is to have one implementation — retire `serve.py`'s write
endpoints and point localhost at the worker. Until somebody does that, assume
the two have drifted and check.

**And verify the round trip with the API, not the UI.** The Studio showed the
craft correctly the entire time it was being thrown away, because it was
rendering its own in-memory draft. `curl .../api/roster` and look for the field
is a ten-second check that would have caught it on day one.

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

### 8.2 Cross-season carry-over — REQUIRED, and it already exists

**Every show whose cast can include somebody who has played before MUST take
its carried relationships from `js/franchise-meta.js`. Writing a second one is
not an option, and Drag Race is the standing example of doing it anyway.**

The franchise already answers "what are these two to each other before the
season starts" — `buildFranchiseMeta` → `seededPairs` — and the answer has
four properties a from-scratch version will not think of:

| `META_WEIGHTS` | what it does |
|---|---|
| `bondAllies` 3, `bondRivals` −3 | rode together, or did not |
| `bondBetrayedVictim` −5 / `bondBetrayedBetrayer` −1.5 | **asymmetric.** Being betrayed and betraying somebody are not the same memory, and one number says they are |
| `bondBlindsideVictim` −4, `bondShowmanceIntact` 4, `bondShowmanceBroken` −3 | the other things a season does to a pair |
| `bondOlderSeasonScale` 0.5 | **the tone-down.** The most recent shared season lands at full weight and every older one is halved again (`Math.pow(scale, idx)`), so a friendship three seasons back is worth 0.75, not 3 |
| `bondClamp` 6 | a seeded bond never starts beyond ±6, and the clamp is asymmetric: it caps the seed's contribution and never pulls a pre-existing out-of-range bond inward |

Repeated kinds stack with diminishing returns (`delta * scale * 0.5` from the
second on), and a season the user excluded from the ledger seeds nothing.

**How a show opts in.** Two predicates, not one overloaded flag, because they
come apart on a crossover:

- `p.isReturnee` — "was this player cast as a returnee". Total Drama and Big
  Brother read this, and it is the right question there: coming back to the
  same show is what makes a past season relevant.
- `historyFromLedger: true` in the show's `js/shows.js` entry — "does the
  ledger know them at all". The Traitors reads this, because everybody has
  history and nobody is returning to THIS show; requiring twenty ticked boxes
  to switch on a system that can already read the ledger means the day one is
  missed, that player walks in with no reputation and nothing says so.

Either way the ledger has the final word — a ticked box over an empty record
still yields no profile. `buildFranchiseMeta` also requires
`formatIsRunnable()`, because a format is stamped on a config long before its
engine exists and the run loop falls through to Total Drama for anything it
does not recognise: a season stamped with a new show and pressed Run IS a
Total Drama season, and reading the ledger on the strength of the stamp alone
gave every veteran in it reputation and grudges no checkbox had asked for.

**Check the ledger can EXPRESS your show's relationships before opting in.**
This is the step Drag Race actually fell down, and a new show will hit it
too, because `seededPairs`'s vocabulary is vote-shaped:

| input | derived from | on a drag season |
|---|---|---|
| `betrayed` | `ep.votingLog` / `ep.defections` — a ballot that MOVED onto the boot | **structurally impossible.** There is no vote |
| `allies` | `gs.namedAlliances` | never written — drag's alliances are derived from bonds each episode and nothing is serialised |
| `showmances` | `gs.showmances` | never written |
| `rivals` | `gs.bonds[key] <= -4` | works |

A drag All Stars cast opting in as things stand would get exactly ONE
relationship kind — rivals, −3 — and would lose "she beat me in the song that
ended my season", which is the most loaded history this format has and the
whole reason `js/dr/history.js` reads it out of the published season document
instead.

So the fork was not laziness; it was the only thing available without
widening the ledger first. That is also why step 4 below says ADD IT TO THE
LEDGER rather than merely "opt in": a show with no vote needs its own channel
into `betrayed` and `allies` — a name on a lipstick, the queen who won the
song that sent her home — and that is a change to `franchise-meta.js`, not a
licence to keep a private table. The private table is what you get if you
stop at "the ledger has nothing for me".

**What going it alone cost here.** Drag Race's All Stars is in neither path —
no `historyFromLedger`, and `isReturnee` appears nowhere in `js/dr*.js`. It
grew its own carry-over in `js/dr/past.js` (`sharedHistory` + `historyBond`),
mapping a pair to one of four constants:

    friend +4 · rival −4 · sent-home −2 · mates +1

That is a category, not a value, so:

- **no recency decay.** A friendship from three seasons ago arrives at exactly
  the same +4 as one from last season. `bondOlderSeasonScale` is the thing a
  returnee format most obviously needs and the thing a from-scratch version
  will not think to add.
- **no clamp**, because there is nothing to clamp — the constant IS the value.
- **no asymmetry.** "She beat me in the song that ended my season" is −2 on
  both sides, though only one of them did it. The franchise version has known
  since Big Brother that a victim and a betrayer remember it differently.
- **no strength.** Two queens who ended inseparable and two who were merely
  friendly both arrive at +4.

And it could not be fixed in place without a second change: `js/dr/export.js`
writes no bonds onto the season document, so the numbers a decay would act on
are not stored anywhere. A show that opts into the franchise system gets all
of this for free and stores nothing extra.

**So, when adding a show:**

1. Decide which predicate the show answers — `isReturnee` if players return to
   this show, `historyFromLedger` if it casts from the whole franchise.
2. If the latter, add `historyFromLedger: true` to the `js/shows.js` entry.
   That is the entire opt-in, and it switches itself on the day the engine
   ships rather than needing a show name added inside `franchise-meta.js`.
3. Check the ledger can SEE your show's results before relying on it. It
   counts `immunityWinner` and `vetoWinner` — the other shows' fields — so it
   reports zero wins for every queen who ever played a drag season, which is
   the whole reason `js/dr/history.js` exists to read the published document
   instead. A new show whose wins have a different field name inherits that
   silently: the profile builds, the résumé is empty, and nothing says so.
4. If the show needs history the ledger cannot express, ADD IT TO THE LEDGER,
   or read the season document alongside `seededPairs`. Do not start a
   parallel table of constants.
5. **Write your season back.** Reading is half of it. `deriveSeasonRecord`
   reads Total Drama's and Big Brother's state (ballots, `gs.namedAlliances`,
   `gs.showmances`), so for any other engine it records nothing useful — and
   until the fifth show, Perfect Match, The Traitors and Drag Race wrote
   NOTHING: an islander's ex, a queen's drag sister and a castle's murdered
   friend were strangers the next time they were cast together. Build your
   record in `deriveSeasonRecord`'s shape (`allies`, `rivals`, `betrayed` /
   `betrayedBy`, `showmances: [{ partner, ended: 'intact'|'breakup' }]`,
   placement) in a `js/<prefix>/ledger-record.js`, and hand it to
   `recordBuiltSeason(rec, seasonNumber)` when the last episode airs, then
   `window.persistFranchiseLedger?.()`. The three existing ones are the
   templates. `tests/franchise-carry.test.js` checks both directions.

### 8.3 A show that plays in its own game state gets NONE of §8.2 for free

`initGameState` (`js/savestate.js`) seeds `gs.bonds` from the ledger AND from
the life log (`js/life-cast.js`: couples still together, exes since) — for any
season that plays on the run tab's own `gs`. Total Drama, Big Brother and Drag
Race do. **Perfect Match and The Traitors open their season function with
`setGs({ bonds: {} ... })`**, so every seeded bond was thrown away before
episode one and neither show read a single past, while both "had" the feature.

If your engine does the same (it is the easy way to make a season headless and
replayable), then:

- **Read** through `js/franchise-carry.js` `carriedFor(people, cfg)`: the ledger
  and the life log in one place, life outranking the ledger on a couple (a pair
  who finished a villa together and split outside walk in as exes). It returns
  `kin` (relations: exes, a couple at their life stage, old friends), `bonds`
  (grudges, with which side resents) and `sums` (one clamped bond per pair, for
  an engine with no relation layer). Perfect Match folds `kin` into its own
  relations layer behind anything the author wrote (`pm/kin.js loadKin`); The
  Traitors lets `sums` replace its random opening bonds for those pairs.
- **Build your ledger record while the inner `gs` is live** — inside the run
  module, after the season function returns and BEFORE you restore the outer
  `gs` — because your bonds live on the inner one. Store the record (it is a
  small per-player summary, not engine state) and write it at the last episode.
- **Copy back** what the rest of the site reads (`bonds`, `popularity`,
  `relationshipDimensions`) onto the outer `gs`, as `pm-run.js _commit` does.
- `historyFromLedger: true` in the registry, if you cast from the whole
  franchise. Perfect Match has it: an islander who was somebody's ex on another
  show walks into the villa as one.

### 8.4 Legacy, published seasons, test seasons and the cloud backup

Built 2026-10-13. That day, Firefox lost every save the user had on the published
site. Their Legacy then turned out to show Paige Turner under Total Drama, to
crown the wrong winners of S11 and Drag Race 1, and to crash outright on a
ledger that held more than one show. This section covers what a new show gets
for free and the few things it has to supply.

**Legacy is one ledger, viewed one show at a time** (`js/franchise-ui.js`).
- The history view mounts the site's own switcher, `js/show-switcher.js`. It is
  the same control `franchise.html` has: **All shows**, then every show in
  `SHOWS`, with the choice kept in `?show=` and remembered for the tab.
- Every section reads `_viewSeasons()` / `_viewFormat()`: timeline, champions,
  record book, Trophy Case, careers, the Scout and the pulse.
- `careerFor`, `franchiseRecords` and `returneePools` take `{ format }`. Called
  without one they span every show, and **everything that decides a season
  calls them without one**, so returnees still remember each other across shows.
- A new show gets its tab with no edit. Its record book is its own, built from
  the registry entry rather than one list for every show:
  - `Most ${words.comps}` / `${n} ${words.compWon}` for its wins, so `comps`
    and `compWon` must read right after "Most" and after a number.
  - One record per `careerStats` row, from the row's **third element, its
    label**: `['dr.lipsyncWins', 'totalLipsyncWins', 'lip syncs won']` becomes
    "Most lip syncs won". `legacy-canon.js` copies those numbers off each
    published placement row onto the ledger record (`rec.players[n].stats`),
    adding them to a matching record without replacing anything else.
  - The result is Drag Race showing lip syncs and Miss Congeniality, Big Brother
    showing HOH, veto and Block Buster wins, and Total Drama showing idols.
  - A show whose seasons are recorded live but not yet published has no `stats`
    until a publish; its `ledger-record.js` may write them itself, under the
    same paths.
- A record appears only when some player on that show has a nonzero count. A
  show with no idols has no idol record because no idol was ever counted, not
  because of a list of shows.
- **Never key a ledger season by `Number(key)`.** `Number('bb-1')` is NaN, and
  looking NaN up found no season, which took the whole tab down. Walk keys
  through `seasonKeyParts`.

**Every winner is a winner.** Mark `winner: true` (and placement 1) on each of
them. A Perfect Match couple, a Traitors pot split three ways and Total Drama
8's Alejandro & Cameron all render as "Winners: A & B". Nothing may assume one
winner per season: the card, the Hall of Fame and the delete prompt all read
`_winnersOf`.

**What the ledger refuses** (`franchise-meta.js _refuseRecord`). It applies to
both recorders, `recordSeasonToLedger` and `recordBuiltSeason`, automatic and
manual alike:
- **A test season.** `seasonConfig.testSeason` is the 🧪 switch in Season
  Basics. A test season is never recorded and never backed up.
- **A replay of a published season.** What was published *is* the record. Two
  published seasons had been replayed and the replays had recorded over them;
  that is where "Sterling won S11" came from.

The manual record buttons show `lastLedgerRefusal()`, so a refusal is never a
silent failure.

**Published seasons are canon** (`js/legacy-canon.js`, on every load). It reads
`seasons_database.json`: rows with `status: Complete`, using the `format` and
`seasonNumber` you export. It then fetches each season's document through the
site's naming rule (`season{N}-data.json`, or `{prefix}-{N}-data.json`) and
compares the ledger record **placement for placement**:
- A record that matches is never touched, so a chronicle-enriched record keeps
  its alliances and betrayals.
- A record that differs, or a missing one, is rebuilt from the document.

So your export (§5) must write `placements[]` with the same names the ledger
uses. A document with no placements is skipped, and the ledger keeps whatever
the last finale wrote.

Two more repairs run once on load:
- `foldShowFranchises` folds any franchise *named* for a show into the main
  one. Before the tabs, people made one franchise per show to keep them apart.
- `dropMislabeledRecords` removes an unpublished record whose name opens with
  a different show's name. The Traitors recorder took its name from season
  settings that still said "Perfect Match 1". `recordBuiltSeason` now renames
  such a record instead.

**The cloud backup covers what goes through `savestate.js`** (`js/cloud-backup.js`).
- Every `_idbPut`, `_idbDelete` and `_idbLedgerPut` in `dc_franchise_db` is
  mirrored, a few seconds later, to the private R2 bucket `dc-saves` behind the
  `dc-studio` Worker (`savesRoute`). That covers season saves, the season in
  play, its checkpoints and the ledger.
- Once a day, a snapshot also takes localStorage and **every other IndexedDB
  database** on the origin.
- So a show that keeps its saves in `dc_franchise_db` through `_idbPut` is
  covered within seconds. One that writes its own database is covered only by
  the daily snapshot.
- A season save's `config` must carry `format` and `testSeason`. The
  saved-season list filters by `seasonFormat(config)` (one show at a time,
  matching the Setup selection), and the backup leaves test saves out.
- The bucket is private on every method, reads included, behind
  `STUDIO_TOKEN`. A new route never needs it public.

**The AI writer's returnee briefing builds itself** (`js/returnee-briefing.js`).
Legacy's "Returnee Briefing" tab is gone. When `current-season.html` assembles
the writer's context for a season, each returnee gets a history line and a Voice
line from the Season Builder Worker, and everyone else gets their voice-profile
line. A returnee is anyone with a `players_database.json` `seasonDetails` row
before this one:
- from the same show, only seasons with a lower number;
- from any other show, every season.

So that `format` stamp (§8, "absent means Total Drama") also decides whose past
a racer brings into a later season.

**The smart cache** (`sw.js`, registered in `main.js`) keeps one complete copy
of the site per Pages deploy. The deploy is identified by the Last-Modified
time that every file in it shares. New files are covered without any edit. It
is off on a local server, and `?nosw` removes it.

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
| `js/social/adapter.js` | three labels in `eventLabel()` + the in-season poll list | identity leak | **collapsed** (2026-08-27) |
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
and must stay. `eventLabel()` and `pollQuestions()` were the other half: three
labels and the whole in-season poll list were decided by which of two shows was
in hand, so a third show was told it had a "Challenge win" and an "Elimination"
by fallthrough and its audience was asked who wins the next challenge and who
makes the merge — identity smuggled in as a ternary. **Fixed 2026-08-27**: the
labels are built from the show's own `challenge`/`elimination` words plus a
`nominationLabel` field, and the questions are a `polls` array on the entry, so
a fourth show declares both and there is nothing to extend. The reason it
survived every audit before that is in §13: the duplicate-hunting grep matches
map shapes only, and a ternary has no braces in it. Note when you write the
replacement comment: **do not quote the ternary you removed.** The guard counts
that shape by matching source text, so a comment quoting it keeps the count
where it was and the ratchet never tightens.

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
9. **Cross-season carry-over** (§8.2) — the moment the show can cast somebody
   who has played before, and BEFORE writing any per-show relationship table.
   It is one flag or one predicate; the alternative is a second carry-over
   that has no recency decay, no clamp and no asymmetry, and by then it is
   load-bearing.
10. **AI fills** (§7) last — they are the only step that costs money per run.

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
- `tests/ratings-shows.test.js` — every show's ratings reader reads signals that
  stay in band, move, and differ between seasons (§2.5, §11.5 W). Add your show
- **Carried relationships come from ONE place** (§8.2). There is no guard for
  this yet and it is worth writing, because the failure is silent: a show that
  grows its own table of per-relationship constants still runs, still seeds
  bonds, and still looks right on screen — it has simply lost the recency
  decay, the clamp and the victim/betrayer asymmetry that
  `js/franchise-meta.js` has had since Big Brother. Drag Race did exactly
  this and nothing went red. The shape to assert: every runnable show reaches
  `seededPairs` through one of the two predicates, and no module outside
  `franchise-meta.js` maps a relationship KIND to a starting bond
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
- `tests/dr-rebook.test.js` — an author's pin reaches the episode it names on a
  season already in progress, the episodes already watched replay byte-for-byte,
  the re-run button returns a different night on every press, and a season that
  cannot freeze its past refuses to re-decide its future. Carries a control arm
  (the same pin with the re-book removed, which must NOT get the challenge) and
  a source-order assertion, for the reasons in §11.5 J
- **Every ordered thing on a screen, against its chance line.** Take the first
  item of any list, rail or call order and ask how often it is the outcome;
  compare to `1 / n`. A drag critique order sat at 100% for the life of the
  feature — see §11.5 P

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

Five ways a test has lied in this repo, all worth checking for in a new one:

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
4. **Rolling state back in a way the real caller does not.** A re-run guard
   rolled the season back by truncating `gs.episodeHistory` in place — which
   leaves the very counter it was checking sitting on `gs`. `replayEpisode`
   does not do that: it replaces `gs` with a DEEP CLONE of the checkpoint and
   rolls the counter back with everything else. The test passed; the button
   returned the same night on every press. **Roll back the way the caller rolls
   back**, clone and all, or you are testing a state transition that never
   happens.
5. **Asserting a ratio the sample cannot carry.** A Faithful play that baits a
   Traitor into a murder was guarded by "a Traitor takes the bait more often
   than a Faithful is attacked by chance" — a true statement about the
   mechanism and an unmeasurable one, because the play needs a live Shield,
   somebody who knows about it, a suspicion worth gambling on and the nerve to
   act. That is 0.37 tests a season and three to five bites per 250 seasons,
   and one bite either way swings the ratio by half a point: the same code read
   0.22/0.04 and then 0.13/0.08 on two samples, and neither number is a fact
   about the engine. **Count the events your assertion divides by before you
   write it.** The fix was to assert the mechanism where it is deterministic —
   `formPreference` called twice, with and without the push, asserting the
   baited name comes out on top — which is exactly the assertion that fails on
   the build that did not work, and takes no seasons at all.
6. **Modelling the caller instead of reading it.** Once a guard models a
   sequence rather than invoking it, the sequence can change underneath and the
   guard stays green. In §11.5 N the ORDER of two lines was the entire bug and
   it lived in `js/run-ui.js`, which nothing the model could reach. Pair the
   behavioural test with one that reads the source and asserts the call sites
   are still in that order — ugly, and the only thing that would have caught
   it.

### K. Committed is not deployed, and an absent field is not a missing column

Two mistakes that compounded into a data loss, both worth knowing on sight.

1. **A worker in the repo is not the worker that is running.** The drag block's
   full support — validator, INSERT, row reader — was committed months before
   it worked, and the deployed worker predated it, so every save dropped the
   field on arrival. Nothing errors: the write returns 200 and the column stays
   null. If a field you can see in `worker/` never appears in the data,
   redeploy before you debug anything else. `npx wrangler deploy --config
   worker/wrangler.toml` is cheaper than an hour of reading.
2. **A JSON response that omits nulls looks exactly like a missing column.**
   The roster reader only emits `drag` when the row is non-null, so 208 rows of
   null produced a response with no `drag` key anywhere — and that was read as
   "the migration was never applied". It had been. The proof cost one command
   and contradicted the diagnosis:

   ```
   $ wrangler d1 execute … --command "ALTER TABLE roster ADD COLUMN drag TEXT;"
   duplicate column name: drag
   ```

   **Never infer a schema from an API response.** Ask the database. `--file`
   uploads through an import endpoint that OAuth tokens are often refused on;
   `--command` uses the ordinary query path and works, which is also the faster
   way to ask a one-line question like this one.

### L. Guards that were never running at all

Section J covers tests that pass against the bug. These are worse: tests that
never executed, and read as somebody else's problem.

1. **A source guard that reads the wrong tree.** Several read their targets
   with a bare relative path — `readFileSync('js/studio.js')` — which node
   resolves against the process's working directory. Run from a git WORKTREE
   that is the MAIN checkout, so the guard opened a different copy of the file
   than the branch had changed: it passed for code that was not there and
   failed for code that was, and neither result said which file it had opened.
   Anchor to the test's own directory:

   ```js
   const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
   const read = rel => readFileSync(join(ROOT, rel), 'utf8');
   ```

2. **A shebang stops a whole suite from loading.** `tools/gen-avatar-manifest.mjs`
   opened with `#!/usr/bin/env node`. Vitest injects its own imports at the top
   of an imported ESM module, landing them ABOVE the `#!`, which is a parse
   error — so `tests/portrait-catalog.test.js` failed to COLLECT and its whole
   suite reported as one red file that looked unrelated to anything. It had
   never run. When it finally did it caught real drift on the first attempt:
   `available-files.json` listed 251 files against 266 on disk, so fifteen
   avatars would have drawn as "Missing file". A module a test imports must not
   have a shebang; invoke it as `node tools/...` where you need it as a script.

3. **An allowlist that was never told about the new field.** The roster guard
   enumerates permitted keys, so the day `drag` first reached the published
   roster — correctly, after the whole write path was finally whole — it
   reported the fix as a defect. Every allowlist in this repo has this
   property. When you add a field, grep the tests for its neighbours.

**A red suite is not evidence that a guard ran.** Check the test COUNT, not the
colour: a file that fails to collect contributes zero passing tests and it is
easy to read the failure as environmental and move on. That is what happened
here for however long the shebang had been there.

### M. The author's choice, accepted and dropped

A control writes its value somewhere nothing will ever read again, and the
screen has no way to say so — from its side the write succeeded.

The drag timeline's six dropdowns store onto `seasonConfig.drSchedule`. A drag
season plays in ONE call: the first press of Simulate Episode runs the whole
thing and queues every finished night, and later presses only shift rows off.
So a challenge pinned after episode one aired was saved correctly, painted
itself pink, and arrived at a season that had been decided minutes earlier.
Reported as *"lipsync lala is getting forced to me when my episode clearly
picked the ball in the dropdown"* — and the report is about the dropdown,
because the dropdown is the only part the viewer can see.

**The queue is the symptom; the dice are the cause.** Give a season ONE rng
stream and every decision depends on how many numbers the decisions before it
happened to draw — so re-deciding anything re-decides everything, and "apply
this change to the rest of the season" cannot be implemented safely. That is
why it never was. Three things make it possible:

1. **One stream per unit of work**, salted off the seed and avalanched —
   `streamFor(seed, salt)` in `js/dr/rng.js`. Never `rngFor(seed + n)`: that
   LCG's first draw is a linear function of its seed, which is the same defect
   that put the same tentpole last in forty consecutive seasons.
2. **The engine returns what it actually ran**, per unit — `playDragSeason`'s
   `schedule`, kept on `gs._drSchedule`. The parts already watched are handed
   back as pins and replay byte-for-byte, so re-deciding the future cannot
   rewrite the past.
3. **Anything that cannot freeze its past refuses to re-decide its future.** A
   season saved before the running order was recorded says so and re-airs,
   rather than replaying a different season under a history that already went
   out — the "episodes that never happened" corruption in a new hat.

Ask of any new show: **can the author change episode seven on the night episode
four goes out?** If the engine plays a whole season in one call — Big Brother,
the castle and drag all do — the answer is no by default, and nobody finds out
until somebody uses the control.

Two latent bugs surfaced the moment the guest draw stopped repeating itself,
which is the §11.5 lesson in miniature: one stream had been drawing the same
handful of alumni every season, so `ARCH_BIAS` could carry `floater: {}` and
`underdog: { underdogFriendly: 0 }` — not even a runway style — with two of
fifteen archetypes judging with no taste at all; and `spare()` built its extra
week without passing `cast`, the argument that excludes the competing queens
from the guest pool, so a week added after a double shantay could fly in a
queen to judge her own season. **Splitting a stream is a coverage change.**
Expect it to fail guards that had never met their failing case.

**And the other half of the same class: a pin the season accepts and then
rains off.** M above is an author's choice written somewhere nothing reads.
This is one that is read, honoured, and then overtaken by a night that never
happened. Traitors schedules a murder SHAPE onto an episode, and three things
can cancel the night before anything asks what shape it is: the room buys it
off with a unanimous banishment, the pact spends the night making a
recruitment offer instead, or the pact is already wiped out. All three are the
format working correctly. What was wrong is that the twist then evaporated in
silence — the timeline said Death Match, the season played, and nothing
anywhere said the night it was booked on never happened. Measured: with a shape
and a deal pinned to the same episode, 16 seasons in 30 lost the shape; with a
shape pinned anywhere in the back half of a season, 9 of 40 nights were eaten
by an offer, because a confident board and `canRecruit` both need a banished
Traitor and so arrive together.

The fix is two lines of rule rather than a special case: **a rained-off pin
moves to the next night, and every one of them leaves a receipt** — here
`gs.tr.shapesMoved`, carrying `{ shape, from, to, why, ran }`, with `ran`
resolved at the end of the season because whether tomorrow's night happens is
not knowable when the pin is moved. It never writes over a night the author had
already booked; that pin is a decision and a rained-off one is not. A twist
that owes the castle something (an On Trial list promising a body tomorrow)
carries forward the same way, and lapses only when the season genuinely runs
out — 22 lists in 60 seasons used to evaporate before that rule existed.

### N. A replay that is a re-air, and the rollback that eats what you write

Two of them, stacked.

1. **The checkpoint carries the answer.** `replayEpisode` restores
   `gsCheckpoints[N]` and re-simulates. For a show whose whole season is queued,
   that checkpoint carries the QUEUE — with episode N still at its head — so
   shifting one row off hands back the identical night. Drag's ↺ re-aired for
   its whole life, with a comment defending it on the grounds that re-deciding
   from episode three would rewrite the ending. True while one stream ran the
   season; false the moment the dice were split, because 1..N-1 then reproduce
   exactly and only N onward diverges — which is what the button's own
   confirmation ("Episodes N–M will be replaced with new results") had always
   promised. **A re-run that returns the same night is not a re-run**, and
   `js/tr-run.js` already worked to that rule.
2. **The rollback re-saves the checkpoint, then you write to it.**
   `replayEpisode` restores `gs` from the checkpoint and THEN RE-SAVES that
   checkpoint from the restored state. Anything written to `gs` after that line
   lands where the next press rolls back over. The re-run counter was bumped
   after it, so every press restored 0, bumped to 1, and produced the night the
   press before had produced: three presses, one distinct episode. Bumping
   first bakes the count into the checkpoint, which is what makes it survive.
   The measurement is the whole diagnosis — press it three times and count the
   distinct nights.
3. **The save carries the queue too.** Not only a checkpoint: EVERY save does,
   because the queue lives on `gs`. The Circle re-ran honestly from its own ↺,
   but loading a season saved at episode 3 and pressing Simulate handed back
   the episode 4 already watched (user, 2026-10-20: "simulating new episode just
   use an episode already simulated before instead of creating a different
   one"). A save cannot know it is being rewound, so the fix is outside it:
   `js/ci-run.js` remembers every aired day by seed and dice in localStorage
   (`dc_ci_seen`), and a day about to air on dice already seen is dealt again
   (`_bringUpToDate`). That covers every way back — the save list, a file
   import, a cloud restore — without touching any of them. **Any show that
   queues its season has this bug until it does the same**; check it by
   saving at 3, playing to 6, loading, and pressing Simulate twice.

   The other five queued shows do it through `js/seen-episodes.js`: before the
   head of the queue airs, `dealUnseen` asks whether its dice were shown and,
   while they were, calls the show's OWN re-run on that episode. Each show
   only names what decides an episode: Perfect Match, The Challenge and the
   race a count per episode (`rerollKey`); the castle its seed plus the chain
   of re-rolls at or before the night (`_trDiceKey`, because its nonce only
   ever rises and a loaded save carries an older one, so a re-run after a
   rewind could land on a night already watched); drag the latest re-roll
   (`_drDiceKey`), checked before the queue is rebuilt because its re-run
   drops the queue. Big Brother and Total Drama play each week live on
   `Math.random`, so a rewind is already a new week. `tests/seen-episodes.test.js`
   is the measurement for all five, and fails all five with the memory off.

   **The suite switches the memory off** (`tests/setup/forget-seen.js`,
   registered as `setupFiles` in the three jsdom configs). The suites replay one
   fixed seed on purpose, often twice in one test, to prove a season
   reproduces; with the memory on, the second play is "already shown" and
   becomes a different season. A test OF the memory sets
   `globalThis.__dcSeenEpisodesOff = false` first.

   Its twin: a queued episode is WRITTEN by the code of the night it was built.
   A fix to the lines never reaches a queue saved before it, and a re-run, being
   new dice, cannot show the fix on the day it was reported. The Circle rebuilds
   a loaded season's queue once on the same dice (what happens stays, the lines
   are today's), and ✎ Re-write does the same for episodes already aired —
   keeping each one whose blockings and room come out the same, clearing from
   the first that does not.

### O. A re-run that rebuilds the season reads state from the future

N is a re-run that hands back the SAME night. This is the opposite failure and
it is quieter: the re-run hands back a DIFFERENT past. Episodes the viewer has
already watched come back with different results, and nothing announces it.

A show whose season is decided in one call — drag books its whole running order
on the first press — cannot re-run one episode. It re-runs the SEASON and then
throws away the weeks that already aired. So the rebuild replays episodes 1..N-1
from the top, and **every piece of live state it touches is state from after
those episodes happened**. Two directions, both wrong:

1. **What the rebuild READS.** `gs.episode` was left at the aired episode while
   the rebuild replayed from week one. `js/bonds.js` reads it in six places,
   four of them unconditionally — the drift term is
   `Math.max(bb weeks, gs.episode)` and a perceived bond is stamped
   `createdEp: gs.episode + 1`; the other two fall back to it only when no `ep`
   is passed — so a rebuild pressed on episode ten
   computed every bond as though ten weeks had already worn on it. The first
   play ran the whole season with `gs.episode` at 0, because nothing inside the
   season loop advances it; only airing a row does. **The rebuild has to see
   what the first play saw**, which here means zero, not "the current week".
2. **What the rebuild WRITES.** It calls `addBond` and `popDelta` for the whole
   season again, on top of values those same calls already produced. Bonds
   double-counted and popularity drifted. The fix is a snapshot of the AUTHORED
   initial state taken at `initGameState` in `js/savestate.js`
   (`gs._drInitBonds`, `gs._drInitLean`)
   — not a recompute, which is a second implementation of the seeding and will
   disagree with it — restored before the rebuild and swapped back for the
   checkpoint's live state after.

The general rule, and it is worth stating as a rule because the list of fields
is not: **a rebuild is a replay. Every live field it reads must be reset to
what the first play saw, and every live field it writes must be put back.** Ask
of each one which of the two it is. `gs.episode` was neither obviously bond
state nor obviously season state, which is exactly why it was missed.

**The measurement.** Play nine episodes. Press ↺ on ten. Compare episodes one
to nine against what they were, INCLUDING the fields nobody thinks to print —
who returned, who was in the room, what the bonds were. A signature that stops
at "who went home" passes while the season underneath it has changed.
`tests/dr-returnee-rerun.test.js` is that comparison; `sig()` in
`tests/dr-rebook.test.js` is the version that missed it, because it never
looked at `dr.returned`.

The Circle missed it the same way, and the first thing to trip it was a code
change rather than a re-run. Its `_fingerprint` (js/ci-run.js) was who was
blocked and who was in. A season loaded after the Ride or Die fix was rebuilt
on the new code: day 3 blocked the same Curtis, so the rebuild was accepted,
but its Ratings crowned Domingo and Sasha where the aired episode had crowned
Domingo and Lila, and episode 4 opened on a Hangout episode 3 never set up.
The fingerprint now carries everything the engine decides about a day and
none of the words: the people, the arrivals, the night's format, the Ratings
and their Influencers, and which scenes aired with whom. The Ratings are what
the NEXT episode is built on, which is why "who went home" can never be
enough on a show where tonight's result is decided by last night's.

**And a related trap, on the same button.** Freezing an aired week freezes what
it was BOOKED with, not what it PRODUCED. The drag schedule records that a week
brought somebody back and, if an author asked for one by name, who they asked
for — it does not record who actually walked back on, because the season picks
her with the week's own dice. So the freeze re-derives her. She is stable only
as long as the dice and the eliminated list are, and if that ever stops being
true an aired episode is rewritten by a re-run of a later one. Anything a week
DECIDES that an author did not pin is in this position; check for it before
assuming the freeze is a replay.

**A third one, cheaper to find and easier to leave in.** State that says who is
gone must be corrected when somebody comes back. `gs.eliminated` was only ever
appended to, so a returning queen was in `gs.activePlayers` and `gs.eliminated`
at the same time, and on the list twice once she went out again. Big Brother
clears it on the way back in; drag never learned to, and drag's own placements
read `exits[]` so the show itself never tripped. The franchise layer does —
`js/aftermath.js` unions that list into the eliminated set and met a queen who
was still competing. **A returning-player mechanic is a state-cleanup task in
every module that keeps its own "who is out" list**, not just in the one that
sends her back.

### P. A spoiler that is not in the future, it is in the ORDER of the present

Every screen guard in this document is about not showing what has not
happened yet. `_tvState` gates a reveal so a sidebar cannot run ahead of the
click; §11.5 B is a screen showing NOW instead of THEN. Both are about time.

This one passes all of that and gives the whole night away anyway.

The drag critiques screen lists the queens in the order the panel critiques
them. That order came straight from the result:

```js
const onStage = [...(call.win || []), ...(call.high || []),
  ...(call.low || []), ...(call.atRisk || []), ...(call.bottom || [])];
```

Winner first, bottom last, every week. So the first card on the screen was
the queen who wins, and the last was the queen going home — **measured at 240
of 240 episodes** — and the viewer knew both before the host had said a word.

The sidebar beside it was correctly gated: it never showed an un-critiqued
queen, exactly as the rule asks. It ranked the ones it had, and its top slot
was the winner 94% of the time, 99% within the top two.

**The first fix was the wrong one and it is the instructive part.** Hiding the
rail's numbers until the last critique landed made the rail honest and the
screen no less spoiled, because the leak was never the labels. Removing the
ranking entirely still left the answer on screen, because the CRITIQUE ORDER
itself was the answer. Only shuffling that order fixed it: first critiqued is
now the winner 18% of the time against a 17% chance line.

**The rule.** Anything ordered — a list, a rail, a sequence of cards, the
order a room is called in — is carrying information whether or not anybody
meant it to. Ask of every ordered thing on a screen: *if the viewer read only
the order and none of the words, what would they know?* A gate on WHEN
something appears does not answer that question, and this codebase's
spoiler-free switch does not either.

**The measurement.** Take the first item of the ordered thing and ask how
often it is the outcome. Compare it to `1 / n`. Do the same for the last item.
Two lines, and it would have caught this the day the screen shipped.

### Q. A second copy of a system, with the hard-won parts missing

The other duplication class in this document (§9) is about identity maps —
nine copies of a show list, all obviously the same thing, all found by one
grep. This one is worse because the copy does not look like a copy.

`js/franchise-meta.js` decides what two players are to each other before a
season starts. It is not a big function, but every constant in it was paid
for: the victim of a betrayal carries −5 and the betrayer −1.5, because a
symmetric number claims they remember it the same way; the most recent shared
season lands at full weight and older ones are halved again, because without
that a friendship from four seasons ago is as strong as one from last week;
seeds clamp at ±6, and the clamp is asymmetric so it caps what the seed adds
without ever pulling an existing out-of-range bond inward.

Drag Race needed the same thing for All Stars and wrote its own, in
`js/dr/past.js`: four constants, one per relationship kind. It works. Nothing
is red. The chart is right, the screens are right, and a season plays fine.
What it lost is every one of those four properties, and none of them announce
themselves — you find out by asking "does a friendship from three seasons ago
arrive weaker?" and discovering there is no code that could make it so.

**Why it happened, and it will happen again.** Not laziness, and this is the
part worth understanding, because the honest version of the trap is more
persuasive than the careless one.

`seededPairs` derives a betrayal from `ep.votingLog` — a ballot that moved
onto the boot — and an alliance from `gs.namedAlliances`. Drag Race has no
vote at all and never serialises an alliance, so three of the four inputs are
empty on a drag season and the fourth (`rivals`, read straight off bonds) is
the only one that fires. Opting in would have produced ONE relationship kind
and dropped the format's most loaded history: the queen who won the song that
sent you home. Looking at the franchise system, finding it had nothing to say
about this show, and writing something that did is a reasonable sequence of
decisions. It still ended in a second carry-over with no decay and no clamp.

The trap is the step that was skipped, not the one that was taken: "the
ledger cannot express my show's relationships" is a reason to widen the
ledger, and it reads exactly like a reason to write your own. The giveaway
that it is the former is that the *weights* have nothing show-specific in
them — a betrayal decays at the same rate on every show, even when what
counts as a betrayal does not.

**The test.** Before writing any table that maps a relationship, a history or
a reputation to a number, grep the franchise modules for the thing you are
about to name. If `franchise-meta.js` already has a weight for it, you are
writing the second copy. If it nearly does — right idea, wrong field names,
or an input your show cannot fill — the fix is to widen the franchise one,
not to fork it. "It reads a field my show never writes" is the most
convincing wrong reason available. See §8.2.

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
| Independent seeded streams | `streamFor(seed, salt)` in `js/dr/rng.js` | one unit of work's dice never move when another's change — the precondition for editing a season already in progress (§11.5 M) |
| The frozen prefix | `playDragSeason`'s `schedule` → `gs._drSchedule` → `_frozenPins()` | re-decide the future without rewriting the past, and refuse when the past cannot be reproduced |
| A re-run that is a re-run | `gs._drReroll = { from, nonce }`, applied only to units at or after `from` | ↺ gives a different night every press while everything before it is untouched (§11.5 N) |
| A rebuild that starts where the first play started | `gs._drInitBonds` / `gs._drInitLean`, snapshotted in `initGameState` and restored before a rebuild | the replayed weeks are computed from the state the first play saw, not from the state the season has reached (§11.5 O) |
| **Carried relationships between seasons** | `buildFranchiseMeta` → `seededPairs`, opted into with `historyFromLedger` or `isReturnee` | allies, rivals, betrayals and showmances become starting bonds — with recency decay, a ±6 clamp and victim/betrayer asymmetry you do not have to rediscover (§8.2, §11.5 Q) |

### R. A guard that fails on a population it did not change

Sections J and L are about guards that are too green. This is the opposite and
it costs more, because a red guard is believed.

A Faithful strategy layer landed on Traitors and the BOARD PRECISION band went
red — the band that asks whether a Faithful holding a read is holding a better
read than pure noise. The feature was rewritten three times on the assumption
that it was the cause: its two cost channels were repriced, then gated so they
could only deepen a doubt somebody already held, then converted from beliefs
into bonds. The number did not move.

What settled it was a NULL CONTROL: the same band, with the feature switched
off at its own flag, and **one extra rng draw per episode** on the castle
stream. No behaviour change whatever — a different population of seasons and
nothing else. It scores 1.62 against 1.48 and fails, on the same floor.

The floor was 0.15 and had been set when the engine measured 1.94–2.11x against
a shipped placebo of 1.70x. It now measures 1.62–1.66x against 1.48–1.51x: the
margin had drifted to 0.19 against a requirement of 0.15, which is four
hundredths of headroom on a statistic whose own comment reports it moving 0.17
between disjoint 200-season blocks. Any feature landing after that drift would
have been blamed for it.

**The rule: before you change a feature to satisfy a guard, perturb the
population without changing behaviour and see whether the guard still fails.**
One extra draw on a stream nothing else reads is enough. If the control fails
too, the guard is measuring its sample and the fix belongs in the guard — with
the control experiment written into it, so the next person does not repeat the
three rewrites. And when you rebase a floor, rebase it against the measurement
and say what you measured, because the numbers in the comment above it are the
ones that drifted.

### S. A harness that measures the absence of the thing it is named after

`tests/tr-murder.test.js` is the guard for the murder catalogue. Eight of its
arms were red for weeks and every one of them was a true sentence about an
empty population: *"on-trial is written, registered and effectively
unreachable"*, *"no plain-sight nights to measure"*, *"the variant channels
wrote nothing at all"*.

Nothing was wrong with the engine. The catalogue had become OPT-IN — a played
season turned up a twist nobody had asked for, so random twists now fire only
from a list the author ticks — and this harness predates that change. It went
on calling `playTraitorsSeason` without the flag, so every season it played was
a standard night every night, and the file that exists to measure the catalogue
was measuring its absence. Two murder shapes shipped in the interval with
nothing in there checking them, and a third was rebuilt.

This is not L (a guard that never ran). These ran, on every season, and
reported honestly on a population from which the feature had been removed by a
default that changed in a different file.

**The rule: making something opt-in is a change to every harness that plays a
season.** Grep for the entry point, not for the flag — the harnesses that break
are the ones that never mentioned it. And when you switch it back on, expect
the arms to fail for real reasons: turning it on here found a shape table with
no entry for a variant that had shipped, a field an earlier rebuild had
deleted, seeds swept from the old population, and four floors that had been
calibrated when the draw was shared between fewer shapes.

### T. The sweep that asks the last season about the first

The most expensive measurement bug in this repo, three times in two days, and
it nearly caused a working channel to be deleted.

A sweep plays N seeded seasons and collects records — rounds, plans, whatever
the arm is about. Then, after the loop, it asks a question of live state:
`alignmentAt(name, ep)`, `gs.episodeHistory`, `gs.activePlayers`, the Shield
ledger, the belief store. **`gs` is whichever season ran last.** Season 250 is
being asked about season 1's people.

It does not look wrong and it does not throw. It produces a number:

* a list-survivor channel was reported as a 2.4x tell, because the denominator
  was `gs.activePlayers` after the sweep — the endgame's two or three people,
  half of them Traitors;
* the same channel then read as pointing BACKWARDS, because the fix used
  `gs.episodeHistory` — season 250's history against season 1's names. Live it
  is 1.5x, which is neither of the numbers that were about to be acted on;
* a bait arm looked the Shield ledger up after the sweep and "proved" the play
  had baited somebody who was not holding one.

**The rule: a sweep helper returns pre-captured facts, not records.** Read
everything the arm will assert on inside the loop, while that season is still
the live one — the alignment, the room that night, the ledger row, the belief.
And a matching trap in the same place: `learn()` keeps the source that CREATED
a belief, so reading the store at season end tests the ORDER of the season
rather than your channel. Assert on a receipt the engine writes, or call the
resolver on a synthetic world.

### U. A read that is a write, because something downstream memoises

A new caller asked an existing derivation a question, in a new place, and every
ballot in the castle changed.

`computeAlliances(ep)` derives the castle's voting blocs from the bond graph
and memoises them on `(ep, living set)` — not on the bonds, which is fine while
the Round Table is the first thing to ask. A new evening feature called it to
decide which blocs had become named alliances. That primed the cache, so the
table then voted on blocs computed BEFORE the evening's bonds had moved.

Nothing about the call looked like a mutation. It took a `const` and returned
an array.

**The rule: a memoised derivation keyed on less than it derives from is a
write, and asking it earlier in the day is a change to everything that asks it
later.** Either restore the cache around your call — save it, ask, put it back,
with a comment saying why — or move your call to where the existing one already
happens. The same question applies to any per-episode cache a new system
touches out of order.

### V. A day written after it is played reads the evening's state

On the day of a profile swap, every scene from the morning came out with the
swapped people in it. Ripper's lines before the swap carried Ivy's stage
directions and Ivy's pronouns ("RIPPER: Save me. Somebody. Please." / "Ivy
refreshes the chat"), and the swap scene told each of them about the other's
profile.

The Circle writes a day's lines at the END of the day (`writeDay`), from
`state`, which by then holds the evening. Anything a twist changes mid-day (who
is behind a profile; the same holds for a name, a role or a team) is read by
every scene of that day as if it had always been so. This is §11.5 B again,
but between two moments of the same day, inside the writer, where no test of a
screen will see it.

**The rule: a change that the writer reads must be logged with the moment it
happened, and the writer must read as of each scene.** The Circle logs who was
behind each profile before a swap (`state.js noteIdentity`), and `peopleOf`
answers as of the scene being written (`state._writing`). A line typed on a
swapped profile names its typist ("IVY (for RIPPER)"), and an aired scene
whose people differ from the day's end carries them for the screen. The test
books a swap and checks the morning's stage directions name the owners; it
fails with the as-of read switched off.

**A scene only the loser can get is a spoiler.** Total Drama's elimination asked
the boot alone whether they felt safe (`tribal.js tribalQA`), its camp gave the
boot alone the "feels safe while a friend keeps a secret" scene (`director.js
voteTalk`), and five other questions skipped the boot outright, so whoever got
one of those was safe. Each choice was reasonable. Together they named the
boot before the reading. Measured on 52 played tribals: the boot was asked a
question 85% of the time against a fair 64%, with 1.5 times everyone else's
lines; the camp's on-the-block scene was the boot's alone at 39% of votes. The
user: "they always focus more on the person getting the boot".

**The rule: choose who a danger scene goes to from the people in danger, never
from the result.** Anybody a ballot or a plan named, anybody scared, anybody
working the camp; the same scene for each; the order hashed, not ranked by
votes. Measure it against the right baseline: the boot versus the *other*
people in danger (86% and 82% after), not versus the whole tribe. The same
read found the converse: a target nobody talks about (27% of surviving names
on the chopping block had no scene, because a plan only aired when one
alliance had made it). Every name two ballots went to is now a plan with its
own scene. The probe is `zz-td-tribal-measure`'s shape: per tribal, who was
asked, who was on the block, and which scenes were about them.

### W. A reader that finds nothing returns a plausible constant

The ratings readers return zero for a fact they cannot find, and a zero is a
real reading ("nothing happened this week"). A show the reader cannot see
therefore gets a rating, and a believable one: 46.1 "Okay". It got that same
46.1 on every season, to the decimal. Four shows shipped that way (§2.5). It
was invisible for two reasons. The exporters never stored the number, so no
page showed it. And Dramagram's fallback for a missing rating (1x reach) looks
like a sensible default rather than a lie told the same way about every season.

**The rule: a reader's test must ask whether different inputs give different
outputs, not only whether the output is in range.** "In range" is exactly what
a constant passes. `tests/ratings-shows.test.js` asks for a spread across four
seasons, and fails on the constant. The same holds anywhere a summary number is
derived from a record whose shape varies by show (a score, a tier, a
multiplier): print it for several seasons side by side before trusting it.

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
- **The episode stage** (`js/episode-stage.js`, mounted by `renderEpisode` in
  `current-season.html`) is show-blind; each show that has one gets a
  **profile** in `js/stage-shows.js` (hosts, the word for a team, how a vote is
  read and an exit announced, chapter names, music beds, "found" items) and a
  **sets file** (`js/stage-sets-island.js` is Total Drama's). `renderEpisode`
  turns the stage on for any format `hasStage()` knows and gives every other
  show the script reader. Titles, ad breaks, reaction shots, pop-ups,
  captions, the vote board, weather, room sound and the results screen all
  come for free. Never borrow another show's profile to switch the stage on —
  that prints its words over yours (§11.5 C).

Everything else is a registry entry and a vocabulary block.

---

## 13. Re-deriving every list in this document

Run these before trusting anything above. They are the searches the document was
built from, so a difference means the code moved and this file did not.

```bash
# Ignore vendored and worktree copies in all of these, or the counts inflate.
# .worktrees/ too: a checkout of every branch in progress sits there, and
# without it the importer count read 244 instead of 90 at the fifth show.
EX='node_modules|\.claude/|\.worktrees/'

# Everything that imports the registry (§1). Expect 90 lines — 89 non-test
# files plus js/shows.js itself, and 134 counting tests (re-derived at the
# fifth show, 2026-09-22; it was 67 and 100 at the fourth). It was 36 before the
# fourth show; drag added roughly thirty files that legitimately ask the
# registry what show they are rendering, which is the number going UP being
# the healthy outcome.
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
# passing every audit in this document. Expect 11 hits across 7 files:
#   js/wiki-view.js (3)  js/cast-ui.js (2)  js/shows.js (2)
#   js/run-ui.js  js/social/events.js  player.html  worker/worker-season-live.js
# Re-derived at the fourth show and DIFFERENT from what this line said: it read
# 13 across a list that included js/social/adapter.js (3, now none) and omitted
# js/shows.js (2, which is the registry itself and allowed). The count moved
# down while the file list moved sideways — which is exactly why the paragraph
# is worth re-running rather than trusting.
grep -rn "=== 'big-brother' ?" --include=*.js --include=*.html .   | grep -Ev "$EX" | grep -v "^./tests/"

# Portrait paths. Anything here that is not the resolver, a documented
# allowlist entry in tests/no-direct-avatar-paths.test.js, or a HOST literal is
# a screen guessing somebody's face from their slug — which cannot know which
# of their looks the season chose. Expect only the allowlisted files.
grep -rn "assets/avatars/[^\"'\`]*\${" --include=*.js js/   | grep -Ev "$EX" | grep -iv host
node tools/gen-avatar-manifest.mjs --check

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

**Re-derived 2026-09-22 at the fifth show (Perfect Match):** 50 non-test files
mention `big-brother`; `js/core.js` 38, `js/quick-setup.js` 25,
`js/stats-export.js` 20, `js/bb/week.js` 16. Map-shaped duplicates are now
eight files — `js/stage-shows.js` (the episode stage's per-show sets) joined
the seven. The ternary grep finds 9 across 6 files (js/cast-ui.js 1, js/run-ui.js
none). The guard's comparison backlog moved `js/quick-setup.js` 8 → 9 and
`js/vp-screens.js` 7 → 8 for the villa, each with its reason beside it.

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

## 14. What the third show actually found

Everything in §§0–13 was written from the first two shows. This section is what
registering a third one turned up that those two had got away with. **Most of it
was not a new-show bug.** It was existing code that had been wrong since Big
Brother shipped and could not be seen until something arrived that the binary
did not describe.

Read this section before §10's order, not after.

### 14.1 A channel is only half a change

The Traitors has two doors out — banished and murdered — so the export grew a
second exit channel, `exits[]`, alongside `eliminated`.

**It shipped with two readers.** Nine were blind to it. The visible result: a
murdered player never left. They stayed in the wiki's voting grid, `stillIn()`
counted eleven people alive on a finale night with two, and their article read
*"3 episodes played · never had a vote cast against them."*

The fix is not nine fixes. `roundExits()` and `publicBallots()` in `js/shows.js`
are the rule, and every reader goes through them.

**If your show has a second anything — a second exit, a second ballot, a second
kind of round — the change is not the field. The change is every reader that has
to learn the field exists.** Sweep for readers of the thing you are adding
beside, not for the thing you added.

### 14.2 Ballots on a channel will be rendered publicly unless something stops them

Murder ballots live in `votingHistory[].votes` beside banishment ballots,
distinguished only by `channel`. That is the right shape (§5) and it is a loaded
gun: **any consumer that iterates the ballots without filtering renders the
show's central secret.**

`js/social/archive.js` did exactly this — the private conclave became public
"Accusation" events on 5 of 9 episodes, and one fabricated accusation generated
18 posts — while `js/social/adapter.js` four files away was explicitly refusing
to write a poll that would reveal the same thing.

Add the guard when you add the channel. There was no assertion anywhere that a
public surface filters to public ballots.

### 14.3 The rule beats the list, every time

§9's eight identity maps were collapsed on 2026-08-25. Writing a **rule** that
fails when any file holds its own show list — rather than trusting the list —
immediately found three more nobody had recorded:

- `tools/regen-rankings-reasoning.mjs` — four show lists in five lines, in the
  tool that writes the ranking-board prose the public site serves
- `tools/backfill-tiers.mjs` — a `BOARD_FILES` copy behind a comment claiming
  the module could not be imported. The claim was false; the import works
- `js/social-page.js` — `?show=` resolved by naming two slugs, so
  `?show=<third-show>` silently left you on the previous show

`tests/show-list-duplication.test.js` is that rule. It walks every `.js`,
`.mjs` and `.html` in the tree, exempts the per-show **data** maps with a written
reason each, and ratchets the surviving two-show ternaries downward.

**A guard that enumerates known-bad cases passes the moment a ninth appears.**

### 14.4 The shapes §13's grep cannot see

§13's commands find `'big-brother'` on a line. These were all invisible to it,
and all of them mattered:

| Shape | Where it bit | Effect |
|---|---|---|
| a ternary split across two lines | `js/stats-export.js` (~2874) | **the entire season export** dispatched to the wrong branch |
| the same | `js/social/live.js` (~30) | the round array picked from the wrong show |
| a hoisted boolean | `season_ref.html` (`hasBlock = bbWeeks.length > 0`) | the whole wiki tab, and a **"Total Drama" label printed in a third show's infobox** |
| `if/else` rather than `?:` | 27 sites | not counted by the ratchet |
| `startsWith('bb-') ?` | `_ruFormatOfDoc` | format guessed by prefix, not read |

Thirteen hoisted two-show booleans and 81 usages remain in production. When you
grep, grep for the **decision**, not the string: any place the code chooses
between exactly two shows is a place a third one is wrong.

### 14.5 Three things that were already broken for the shipped shows

None of these were caused by adding a show. All three were found by adding one.

- **`_rebuildByShow` resolved nested career stats with `startsWith('bb.')`**, so
  a third show's six `careerStats` pairs read a key that did not exist and
  **every career totalled zero**.
- **`_tagSeasonDetail`'s split-brain guard only knew Big Brother**, so a third
  show's block could land on a **Total Drama** appearance — the exact silent
  career-merge §8 warns about.
- **`loadSeasonData` read every ranking column through `isHouse ? A : B`**, so a
  third show loaded **zero on every column** and its board was a strictly
  monotone restatement of placement. That file's own header documents this
  failure for Big Brother; it happened again anyway.

Also live and pre-existing: `js/wiki-fill.js` iterated an **array** with
`Object.entries`, so every Total Drama round had been emitting
`votes: 0 [object Object], 1 [object Object], …` into the AI wiki-fill prompt for
fourteen published seasons.

**Adding a show is the cheapest audit of the previous ones you will ever run.**
Budget time for fixing what it finds.

### 14.6 Co-winners, and a field that is a tally

`docs/ADDING-A-SHOW.md` §5 asks for `winner { name, playerSlug, vote, runnerUp }`
— singular — and an ordinal `placement`.

**Total Drama season 8 already had two winners.** `season8-data.json` has
Alejandro *and* Cameron at `placement: 1`, with `winner{}` naming Alejandro. Every
page named one of them; `season_ref.html` **crashed** on a null winner; and the
wiki prompt told the AI that Cameron *"won the final vote 4-4"* — a vote he did
not win alone.

The rule is `seasonWinners(season)` in `js/records.js`: `winners[]` →
`placements[]` at 1 → `winner{}`, most complete first. Co-winners all take
`placement: 1` and `status: 'winner'`; `winner{}` is populated **only** where a
season genuinely has one. Eleven readers were wrong, nine were already
plural-safe, four were decided and deliberately left — including D1's
`seasons.winner_slug`, which stays NULL on a split because filling it would
invent a fact.

**Do not pick a "main" winner to satisfy the schema.** Taking `winners[0]` is the
same thing with an extra step.

Separately: **`winner.vote` is a TALLY**, not prose. A show whose finale has no
jury put its endgame sentence there, which carries the pot — so *"all of it to
Bowie"* contains `72,233`, `js/social/archive.js` read two numbers as a jury
vote, and the feed posted about **a jury verdict on a show with no jury**. Prose
belongs in its own field.

### 14.7 `isReturnee` is two things, and your show may split them

`isReturnee` drives **art** (`js/players.js` swaps to the `<slug>-returnee`
portrait) and **reputation** (`js/franchise-meta.js` gates the entire profile,
reputation, instincts and callback build on it).

On Total Drama and Big Brother these coincide. On an all-alumni show **every
player has history and nobody is returning to this show**, so the flag says no
and the truth says yes — and franchise-meta priors are an evidence source.
Without the split, twenty checkboxes must be hand-ticked every season, and the
day one is missed that player walks in with no reputation and nothing reports it.

`hasFranchiseHistory(name)`, derived from the appearance ledger, is the
predicate; `isReturnee` keeps its per-season casting meaning. Measured: 20/20 of
an all-alumni cast get a profile under the derived predicate against 0/20 under
the flag, with **0 of 262 Total Drama and 0 of 17 Big Brother** classifications
changing.

**Known and unfixed:** grudges come back **empty** on the real ledger under
either predicate. `backfillFromSeasonData` writes placement, winner, finalist and
chalWins and never writes `betrayed`/`allies`/`showmances`/`blindsidedBy`, which
is what `seededPairs` is built from. Every test passes because the fixture seeds
those fields. **The grudge system currently runs on no data, on all shows.**

### 14.8 Popularity, and the pooled statistic that hides itself

§8 already says `gs.popularity` must never rank anybody. Two additions.

**A show where the audience knows a secret needs two ledgers, not one number.**
When the crowd knows who the villains are, a villain playing brilliantly is
*entertaining*, not *admirable*. Keeping one number makes popularity a competence
score for whoever the crowd enjoys. The Traitors keeps `affection` and
`spectacle` separately, priced per event; in 100 seasons of 100, the spectacle
leader is not the affection leader.

**And check your correlations within each group, not pooled.** Popularity against
placement reads a harmless **−0.299 pooled** and **−0.538 among Faithfuls** —
because the players who last longest are the ones whose affection is damped, so
two accrual curves of opposite slope average into innocence. The same trap caught
`notoriety` (−0.308 / −0.503) and `audienceStanding` (−0.013 / −0.186 / +0.233).

**Before trusting any pooled statistic, ask whether the population contains
groups whose relationship to the quantity runs in opposite directions.**

### 14.9 The ranking currencies that look right are placement measured twice

Measured over 4,000 player-seasons, correlation against final placement:

| currency | r |
|---|---|
| rounds survived | **−0.924** — it *is* placement |
| finished on the winning side | −0.686 |
| correct eliminations driven | −0.635 |
| missions/comps won | −0.629 |
| a power won late | **−0.019** |
| being targeted | **+0.014** |

**Capping a count makes it worse** (−0.635 → −0.658 at cap 2), because what
survives a cap is "did you last long enough to see one at all".

The currencies that survive are the ones a longer run does **not** accumulate.
And check the split that matters for your show: the one column that looked
independent (`Wanted`) turned out to be **−0.171 below the final table and +0.189
at it** — every column reverses across that line. Report a column's **density**
beside its correlation: the heaviest weight on the Traitors board fires for about
1 player in 20.

### 14.10 The vocabulary guard needed extending, and had no reverse

`tests/show-vocabulary.test.js`'s header says there is no list in it to extend.
**There was**, and it had not been: `EXCLUSIVE` lacked `jury`, `merge`, `house`,
`beach`, `challenge` and the stem `evict` — which is why every one of these
shipped:

> *"Voted to evict"* over a camp (on **fourteen published seasons**) · *"played
> The Traitors 1 without winning a challenge"* (they won four missions) ·
> *"Never made the merge"* on a show with no merge · *"He finished 5th as a
> murdered."* · *"enjoy the jury house"* on a show with no jury · 33% of social
> handles signed `@@bigjury`, `@@campfireapologist`, `@@antitribal32`

**There was also no reverse-leak arm at all** — no third-show noun was forbidden
on a Total Drama or Big Brother page. Both directions now run.

Two more vocabulary sources worth knowing: `worker/worker-episode-live.js` falls
back to Total Drama's tone examples for an unknown show, directly under its own
instruction *"Do not import words from another format"*.

**The social feed was the largest instance, and it was not a vocabulary
problem.** 6.4% of a Traitors season's posts carried another show's noun, but a
noun swap would not have fixed the rest: the topics themselves were about votes,
blindsides and jury verdicts. A show now brings a **social pack**
(`js/social/packs/<show>.js`, listed in `packs/index.js`): its own event reader
for both a played row and a published document, its topics and lines, its
regular fans and its alumni-host takes. It keeps only the shared topics tagged
`layer: 'fandom'` in `js/social/topics.js`, which are held neutral for every
show by `tests/social-packs.test.js`. A show with no pack gets the vote-show
library unchanged — that library is Total Drama's and Big Brother's game layer,
and both keep it.

The Traitors and Drag Race both have packs. Each declares `kinds`
(label/volume/when-in-the-episode/which shared kinds it implies), `records(gs)`
(the AIRED episodes — an engine's own round array can hold nights that have not
been shown), `context(source)` (season-level facts off `gs` or off a published
document, so the played and published paths describe the same night),
`events(record, meta, { make, ctx })`, its topics, phrasings, aims, regulars and
host takes. Adding one is the fix for any show whose fandom argues about
something other than a vote; nothing branches on a slug to do it.

### 14.11 `\b` inside a template literal is U+0008

```js
new RegExp(`\b${name}\b`)   // backspace, backspace — matches nothing, ever
new RegExp(`\\b${name}\\b`) // word boundary
```

**Four test guards in this repo had never once matched**, and one production
`.replace()` in `js/rankings-update.js` had never stripped anything. It is
invisible by inspection — check `charCodeAt`, not appearance. `ratings.test.js`
additionally carries an eaten backreference (`\1` as U+0001), so that guard is
doubly inert.

And when you fix one, check what the fixed version now does: the repaired
rankings regex ran to `[^]*$` and **truncated every later season's line**. A dead
no-op became data loss.

### 14.12 Guards that pass for the wrong reason

Found by mutation, in guards this project wrote:

- **A guard satisfied by the text of its own fix.** A source-text ratchet counts
  occurrences in source, so a replacement comment quoting the old ternary kept
  the count unchanged.
- **A coverage floor set below the real population.** Floor 300 against 532 files;
  capping the walk at depth 2 hid 232 files *and a planted three-show map*.
- **An exemption list that can only shrink — but not one that stops it growing.**
  A planted identity map plus a bogus exemption ("looks fine to me") passed; the
  reason string was never read.
- **A test that recomputes its own expectation from the thing under test.** Flip
  the table's value and the expectation flips with it.
- **An assertion satisfied by the wrong element.** "Does the page contain
  'murdered'?" is satisfied by the infobox's own `Status: Murdered`, so a grid
  that never draws the cell passed.
- **A source-text guard that stopped matching its own source** and went quietly
  green (`live-sync-show.test.js` does this today).
- **A comment-stripping regex that stripped nothing**, because `.` does not match
  a carriage return and the file had CRLF endings — the same class of bug the
  strip exists to remove.

**A mutation proves a guard can fail. It does not prove the margin is right, nor
that it measures what its name says.** Ask all three.

### 14.13 Operational

- **Stashes are per-repository, not per-worktree.** A `git stash` inside a show's
  worktree reaches into the same stack as the main checkout's uncommitted work.
  Copy files aside, or use a separate temporary worktree.
- **`git checkout <file>` is `reset --hard` scoped to one file**, and it will
  eat uncommitted work without asking. A task lost a file's worth of edits
  reverting a mutation this way. To undo a mutation, apply the inverse edit --
  never check the file out.
- **A constant that lives in three files is not a constant.** The 46px nav
  offset is now written in the mockup, the builder and a comment. Put it in one
  place the moment you notice the second copy; every duplicate-source drift in
  this document started as two.
- **Creating and removing a temporary worktree empties `node_modules/.bin`.**
  `npx` then reports the runner missing while every package is fine. `npm rebuild`
  restores it in seconds. This happened twice.
- **Brief from the branch, not from a document.** Three tasks in one plan were
  briefed against states the branch had already passed — including §9's eight
  maps, collapsed days earlier. Every time, the work was still worth doing,
  because what was missing was the thing that *keeps* the property true.

### 14.14 Every future reality show is an alumni source for The Traitors

The Traitors consumes franchise history when an entrant is classified as an
**Alumni** contestant. Today the only source shows are **Total Drama** and
**Big Brother**. That is a fact about the current registry, not a permanent
allow-list: more reality-show engines will be added, and their contestants must
become available to The Traitors without adding another hardcoded show list.

When adding a competitive reality show, publish the following fields through
the shared season/appearance ledger whenever that format genuinely records
them:

- format slug and display name;
- season identity;
- stable player slug and identity mapping;
- placement and winner/finalist status;
- competition, challenge or mission record;
- alliance and relationship history;
- betrayals or decisive votes; and
- exit type.

Do not invent fields the show does not have. A show without a jury exports no
jury record; a show without challenges exports no challenge wins. The Traitors
must distinguish a missing concept from a zero result.

The entrant's background type decides how the data is read:

- **Alumni** uses both recorded show history **and** the player's personality,
  archetype, occupation and backstory. History is reputation, not personality.
- **Celebrity** uses public recognition, career, backstory and personality, but
  no simulator history is invented.
- **Civilian** uses occupation, life experience, backstory and personality and
  is not treated as publicly recognizable.

Casting remains manual. The history ledger supplies context for the people the
user selected; it does not choose the cast or enforce a ratio between source
shows. Derive eligible source shows from `js/shows.js` and compatible ledger
records. Never write `['total-drama', 'big-brother']` into Traitors casting
logic: that list is true today and stale the day the next show ships.

---

## 15. What the fourth show actually found

The third show's §14 was written by a show that still had a vote. The fourth
does not have one, and almost everything below follows from that.

### What was already broken and only a fourth show could show it

**`runAudienceVote` never forwarded `_gs`.** It called
`audienceBoard({ eligible })` and fell through to the module-global `gs`, so
every headless caller — every harness, audit and offline export — voted on an
empty popularity ledger. It does not throw and does not read as broken: a board
of all-zero standings still returns a name, and the sash still renders over it.
Two Big Brother callers had always run inside a live page and never noticed.

**A test can pass by being unfailable, twice in one file.** One handed
`alumniPool` a `_players` option that does not exist, got an empty pool, and
returned early on the empty check. Another asked for `minNative: 0` — and the
guard is `native.length >= minNative`, so zero means "no natives is already
enough" and it returns the empty native list without ever topping up, the
opposite of what the number reads like. Both reported that a casting path
worked while never walking it. **Before trusting a new guard, break the thing
it guards and watch it fail.**

**A headless season is not the game.** `playDragSeason` with no `bond` function
falls back to `() => 0`, so every bond-gated event becomes unreachable. An
event measured a flat zero across forty seasons and looked dead; the gate was
satisfiable in 13% of queen-episodes and the harness had switched it off. Any
audit harness must carry the same layers the run loop carries.

### What a show with no vote reveals

**Every reader built on a ballot returns silently empty.** `readSignals` gave
eleven zeroes for a whole season because it looks for who flipped and who was
named. The fix was a `roundShape(format) === 'placements'` branch — but the
lesson is that a reader with no data does not fail, it flattens. Two of its
signals then had to be re-derived and one, `strategy`, came back as a
**constant**: 0.70 on every episode of forty seasons, min equal to max. It
passed the existing stability test, because 0.70 is a respectable mean. **Guard
the spread, not the average** — a constant wearing a signal's name is worse
than a zero, because a zero is visibly not reading.

**The edit layer had a reader and no caller.** `_deriveScreenTime` looks for
camp events, acts, ballots and challenge scores, and a runway night records
none of them — but worse, `dr-run.js` never called `updateEditLayer` at all. So
every queen read "Invisible" and the audience pulse drew a season of blank
bars, which looks like a rendering fault and is a wiring one.

**Naming things well breaks keyword readers.** The ratings `showmance` signal
matched `/showmance|romance|spark|flirt|kiss/` against an event type, and this
show's romance beats are called `something-there` and `quiet-thing`. A reader
guessing at another module's naming stops reading the day somebody names
something well. Match by exported id.

### The bug class that survives every audit in this document

**Computed, stored, and drawn nowhere.** It happened five times on this show
alone: Miss Congeniality had no scene; `dr-run.js` never wrote
`gs.dr.congeniality`, which `stats-export.js` had always read; the crowning
screen filtered scenes on `step === 'exit'` while the winner's speech lives on
`finale-crown`; the girl group's track reached the row and no screen read it;
and `showmance` was written onto `dragSeasonDetails`, which the publish path
never calls — `mergeDragSeason` builds appearances from the document's
placement rows.

None of these throw. None fail a test that checks the field exists. The only
thing that finds them is **rendering the real output and measuring how much of
it is there**: `npm run audit:dr-spec` renders every screen of a hundred
seasons and measures the text each produces, which is how 64 claimed-but-empty
screens and a nine-way gap in challenge panels surfaced at once.

### A test pinned to a stream is not a test of a rule

Three broke here without anything being wrong. One asserted every pre-finale
row has exactly one exit — false, because a double shantay is on by default and
sends nobody home; it held only because that seeded season never produced one,
and broke the moment new werk-room events shifted the RNG. Another demanded the
cold open never name tonight's eliminated queen — stricter than the bug it was
written for, and wrong as a rule, since she is in the room all episode. A
third pinned a known-wrong behaviour and named its own fix in a comment.

**Assert the rule and its exceptions.** If new prose can break your test, it
was measuring the random stream.

### What the next show should do differently

1. **Write the audit before the polish.** Every real defect on this show came
   from `audit:dr-spec` or from printing output and reading it. Not one came
   from a passing suite going red.
2. **Print the chance line beside every rate.** "The best résumé wins 39% of
   finales" is not a finding until you know a coin toss gives 25% — and on the
   first measurement it was *15%*, i.e. anti-correlated, which no absolute
   number would have shown.
3. **Check the source before writing the mechanic.** The BTM/BTM2 split, the
   finale's five different era-shapes, and the porkchop all came from
   `api.php?action=parse&prop=wikitext` on the show's wiki. Direct page fetches
   return 402; the API does not.
4. **Expect the show's own vocabulary to fight the registry.** "Camp" means a
   style here and a place on Total Drama; "competition" and "house" belong to
   other shows. The vocabulary guard caught all three, including once inside a
   comment explaining a previous fix.


---

## 16. What the fifth show actually found

Perfect Match (Love Island) is the first show whose subject is RELATIONSHIPS
rather than a game, and the first built plan by plan with a transcript you can
read. Its spec and plans are in `docs/superpowers/specs/2026-09-22-perfect-match-design.md`
and `docs/superpowers/plans/2026-09-2*-perfect-match-*`. What follows is what
the next show should not have to discover again.

### 16.1 The order that worked

1. **Engine headless first, with its spec audit** (`npm run audit:pm-spec`: a
   hundred seasons, every rate beside its chance line) — before a single screen.
2. **The writing layer second, as its own plan.** Lines are SCRIPTS picked by
   facts (`js/pm/script.js`), with their own rng stream so a line can never move
   a result, and a repetition guard. Not templates filled with names.
3. **A readable transcript tool** (`PM_SEED=n PM_CAST=24 npm run pm:transcript`
   → `transcripts/pm-season-<seed>.txt`, gitignored). **This was the single most
   productive tool on the show.** Every audit number was green while the
   transcript showed a girl choosing in a boys' choice, a man walking out ten
   minutes after reclaiming his partner, and the same scene played twice at
   Movie Night. Read one full season, episode by episode, after every large
   change. Nothing else finds the contradiction between two scenes.
4. Run tab, then screens, then export — the site's other layers.

### 16.2 A show that plays in its own game state

See §8.3 — it is written up there because it applies to any engine. Short
version: `setGs` at the top of your season function throws away the franchise's
and the life layer's seeded bonds; read them through `js/franchise-carry.js`
and write yours through `recordBuiltSeason`.

### 16.3 The season's shape: breathing room, and constants that assume a length

- **Check the real show's rhythm before fixing yours.** The villa ran six
  dumping episodes in a row after Casa. The wiki (UK 9-12) has dumpings 3-8 days
  apart, and the real show airs six episodes a week — the viewer sees days of
  villa life between each. Any two dumping nights back to back now get a villa
  day between them (`moment: 'villa'`, `schedule.js`).
- **Adding episodes is §11.5 F in motion.** The six new villa days took walks
  from 68 to 114 a hundred seasons and wore every line pool thinner, because
  risks and draws were per EPISODE. Scale anything that is "per unit of time"
  by the episode's days (`maybeWalk`'s `share`), and re-measure repetition.
- **A calibration template pins the builder** (`SEASON_TEMPLATE`, held equal to
  `buildSchedule(...)` by a test). When the shape changes on purpose, regenerate
  the template from the builder — and expect every test that says "episode 5 is
  the first vote" to break. Look slots up (`e.slot === 'vote1'`), never numbers.
- **A three-couple final is a longer season, not the same one with a double
  dumping.** An option that changes how many must go must change how many
  nights there are to lose them on.
- **The timeline must build the same schedule the season plays.** It read the
  cast and forgot `finalCouples`; with a three-couple final the Season Timeline
  showed a different season from the one that played.

### 16.4 Writing: the bug classes reading found (check every new pool)

Each of these shipped, was read in a transcript, and has a fact or a gate now.

| class | example | the fix |
|---|---|---|
| **invented past** | "remember how nervous we were on the first day" between two who arrived ten days apart; "the dance you did last night"; "watching you for weeks" on day 5 | facts from the record: `known` (both two episodes in), `sameStart`, `weeks`, `comfortedYesterday`, `rowedBefore` — or rewrite into the present |
| **engine outcome vs words** | a friendship scene the engine ended in friction, with a warm beach hut after it; "Tasha has taken Marcus for a chat" after Marcus said no | the ending is decided BEFORE the words (`events.js ENDINGS`), and is a fact the pools gate on (`friction`, `rebuffed`) |
| **a fact that means something other than it reads** | `taken` is "has a partner who is NOT {b}" — cast the partner as {b} and a waiting islander at Casa read as single ("nobody is coming back for me") | cast only who is physically in the scene |
| **casting the wrong confidant** | a crush confided to one's own partner; a friend cast from the other Casa villa; a bereaved islander comforting someone else | `friendOf` never picks the partner; `roomMates` not `state.villa` while split; nobody whose partner left tonight listens |
| **the verdict overclaims** | "every islander who is still single has been dumped" over a single who stayed; "the only one still standing" with two standing | pass what the engine decided (`staying`, `of: 'some'|'all'`) |
| **a rule the viewer is never told** | a girl picking in a boys' choice (new arrivals choose first — true, never said) | if the engine applies a rule, a scene says it (`recouple-first`) |
| **a question nobody answers** | "can I ask your advice?" followed by "we should get ready" | an ending pool must not follow an open question; write the answer in |
| **self-contradiction in an intro** | wanting "happy, loud, fun" and put off by "the loudest one at the table" | roll the ick filtered against the type (no re-roll: keep the draw order) |
| **"them" for a known person** | "I think I'm starting to really like them" about a named partner | use the slot (`{pa}`) and gate `taken` |

**Repetition is a function of volume, not only of pool size.** Measure, per
scene kind: plays per season, distinct lines used, worst repeat of one line.
On this show: a pool of ten carried six of one line because the guard only
discounted a line's LAST use (it now halves per earlier use); a vote reason
had three lines on nights with four voters; one pick-hut line served a whole
six-pick ceremony; intros were unique per pair but not per season, so two
islanders shared one self-description. And sometimes the fix is frequency:
turn-downs were 7 of 90 scenes an episode, so their pool looped whatever its
size — the cure was fewer pulls, each costing proportionally more with the
public.

**Your own guards catch your own lines.** The clever/quip guard, the regional
word guard, the other-show vocabulary guard (`house` is Big Brother's) and the
subject-pronoun guard all failed on lines written during these fixes. Run the
line tests after every batch of new lines.

### 16.5 Realism: look it up before you build it

Every dumping mechanic that felt wrong in play was wrong against the wiki:
a bombshell's steal leaves the partner single and VULNERABLE, not dumped (UK
11 d22, UK 10 d39); the first public vote dumps islanders, never a couple;
new arrivals choose first at a recoupling; couples-only week sends one couple
a night. The user's standing instruction is to check the internet first.
Sources that work: `loveisland.fandom.com/api.php?action=parse&page=Love%20Island%20(Season%20N)&prop=wikitext&format=json`
(the page names are "Season N", not "series"), and Wikipedia's per-series
coupling tables through a page fetch.

### 16.6 A public ledger, and the label that quietly stopped being earned

- Labels need a saturation brake at the top (the climb slows near 100) or every
  finalist ends on Fan Favourite.
- **A villain needs CONCENTRATED negatives.** Small costs spread across the
  whole villa (a pull here, a gossip there) never add up on anybody. A pattern
  rule — each bad week the public has seen makes the next weigh more — made the
  label track repeat offenders.
- **Removing an event source can silently kill a label.** Capping the day's
  arguments at three (right for the show) took "a villain by episode 12" from
  70% to 15%, because the rows were the only steady supply of bad weeks.
  Nothing failed. Found by bisecting (§16.8).
- **A label's name is a claim.** "Invisible" computed from approval meant
  "neutral", so almost nobody was invisible; it now reads airtime (below the
  villa's median, with no strong opinion).
- The rule from §14.8 held: islander decisions never read public approval
  (`tests/pm-ledger-readers.test.js`).

### 16.7 Life after the show

Couples who leave together are exported as `showmance` on the appearance, and
the life resolver (`js/life-resolver.js`) takes it from there: 75% still
together after the first off-season, splitting at 22% per off-season while
dating and far less once settled, and being cast again (especially alone) the
likeliest thing to end it. A couple that holds steady currently gets no news
in 65-80% of off-seasons — a known gap, proposed but not built.

### 16.8 Tools and operational traps

- **Probes.** A throwaway `tests/zz-*-audit.test.js` run with the audit config
  (`--config vitest.audit.config.js --reporter=verbose`) prints a measurement
  without joining the suite. Delete it before committing.
- **Bisect a regression with scratch worktrees.** `git worktree add --detach
  <scratch>/wt-<sha> <sha>`, link `node_modules` into it (`mklink /J`), copy the
  probe in, run several in parallel. **Remove the link before removing the
  worktree** — removing a worktree whose `node_modules` is a junction can reach
  through it.
- **Noise.** 100 seasons move a rate by about ±2 points and a 60-season probe by
  more; judge a small change at 300, or across several seeds.
- **Another session may be working in the same tree.** Never `git stash` (it
  takes their uncommitted work with it). If a file holds their edits and yours,
  stage only your hunks: rebuild the file from `HEAD` plus your change in a
  scratch copy, `git hash-object -w` it and `git update-index --cacheinfo`.
  If the remote moved and the tree is dirty, merge and push from a temporary
  worktree (`git worktree add --detach <tmp> origin/main`, merge your commit,
  `git push origin HEAD:main`) — the local branch then fast-forwards later.
- If `node_modules/.bin` is empty, `npx vitest` / `npm run` fail with "not
  recognized"; `node node_modules/vitest/vitest.mjs run …` still works.
- The user plays on GitHub Pages, not a local server: anything gitignored
  (music, portraits) never reaches them.

### 16.9 What the sixth show should do

1. Answer §0, then read §8.2 and §8.3 before writing a line of engine: decide
   whether you play in the run tab's `gs` or your own, and wire the franchise
   read and write the day the engine plays a season.
2. Build the headless engine and its spec audit, then a transcript tool, then
   READ a season. Only then build screens.
3. Look up the real show's rules for every elimination mechanic, and write the
   source into the comment.
4. Give the schedule the real show's rhythm; scale per-time risks by days.
5. Write lines as scripts gated on facts from the record. Every new pool:
   no invented past, no unanswered question, nothing the engine did not decide,
   the right person cast in the right room.
6. Measure repetition per kind (plays vs distinct lines vs worst repeat) and
   frequency per kind (share of an episode's aired scenes) — both.
7. Bisect any rate that moved without a reason, before tuning it back.

---

## 17. What the sixth show actually found

The Circle is the first show where nearly everything that happens is a
CONVERSATION: private chats, group chats, Circle Chat, the Hangout, the visit,
the goodbye video. Nobody wins a challenge or casts a vote in a room; they type.
It is also the first show built on its own episode viewer, one click per line.
Both are worth copying for any dialogue-heavy show that follows. The code is
`js/ci/` (engine and writing), `js/vp-ci/` (the viewer), `js/ci-run.js` (the
run tab), `js/ci-cast-ui.js` (setup). The project memory `project_the_circle.md`
carries the running notes.

### 17.1 The dialogue-heavy engine: a scene is decided, then written

A Circle day is a list of SCENES (`addScene(state, kind, who, data, seenBy)`),
each with what it decided in `data`. The words come later, from the record.
This is §16.1's order made strict, and it is the only reason a scene's lines
never contradict what the numbers did.

1. **The outcome first.** A private chat (`js/ci/conversation.js runChat`)
   decides its ending (`warm | neutral | cold`) from the listener's feelings,
   applies its effects, then rolls slips, then its intent's own consequence (a
   pact, a claim learned, a belief nudged). Only then is a line picked, and the
   line pool is keyed on the ending (`chat.<intent>.<ending>`). An intent is a
   REASON to talk (`chat.js INTENTS`, each with a utility from stats, bonds and
   beliefs); nothing is chosen for how it reads.
2. **Knowledge has a witness.** A belief only moves through `nudgeBelief(...,
   scene)`, which throws if the player was not in `scene.seenBy` (§11.5 D,
   enforced at the source). A claim is learned from someone, in a scene. Talk
   about what happened (`chat.js debriefTopic`) only picks topics both people
   saw.
3. **Pools are SCRIPTS, not templates.** An entry is `{ id, when, turns:[{ by,
   say | send | react | video | post }], beat }`. `say` is spoken aloud in the
   apartment, `send` is the message on the screen (and the spoken dictation is
   derived from it), `react` is a line to the room, `beat` a stage direction.
   Roles are `a` / `b` / `c` (and `host`); `{a}` is the PROFILE's name in speech
   and the REAL person in a stage direction. `when` filters on facts from the
   record (`script.js FACT_KEYS` is the whitelist; a test refuses any other
   key). Every pool keeps at least three entries with no `when`.
4. **The picker is where repetition is won** (`script.js pickEntry`). In order:
   a line used on this pair is out; a line used today is out (by its WORDS,
   every line of the exchange, not only its id: the same sentence lives in
   several pools); a line in its pool's last half is out while anything else
   fits (`RECENT`: the use decay alone forgets order, and once every line in a
   small pool had aired once they were all equal again); each earlier use
   multiplies by `USED_DECAY` 0.12; a sentence either speaker in the exchange
   has said before weighs `SAID_AGAIN` (both sides: the REPLY repeats as surely
   as the line). When nothing fits, the fallback still prefers what was not
   heard today. Measure with `tests/ci-repetition.test.js` (under 12% of lines
   repeat one already heard, under 1.5% a person repeating themselves) and the
   spec audit's "hardest-worked pools" (plays, distinct lines, worst repeat).
5. **The voice is a layer on top** (`js/ci/voice.js`). A pool writes a message
   once with `{e:heart}` and `{t:Hashtag}` tokens; each sender's voice keeps or
   drops them, applies their register (caps, ellipses, lowercase, catchphrases)
   and, for a catfish, the persona's register until the cover cracks. **A token
   that carries the meaning must survive:** a hashtag that OPENS a message is
   the message and is always kept ("#CircleFam forever" from a player who never
   hashtags printed "forever"). Two different raw lines can also converge after
   styling ("Honestly I've been thinking the same thing" and "I've been
   thinking the same thing 👀" are the same words in a blunt voice): if a
   test counts repeats on rendered text, reword one of them.
6. **A day is written after it is played** (`season.js` calls `writeDay` at the
   day's end). Anything that changes WHO is behind a profile mid-day must leave
   a record the writer can read as of each scene. See §11.5 V.
7. **What airs is chosen** (`js/ci/airing.js`): `ALWAYS_AIRS` kinds, then the
   private chats by drama (`DRAMA` per intent, a cold ending, a claim, a noticed
   slip) up to `CHATS_PER_DAY`. A new intent with a high drama weight takes
   screen time from the quiet ones; raise the cap when talk is ADDED rather
   than swapped (17.5).

### 17.2 The viewer: one click is one line

`js/vp-ci/` replaces the column-of-cards episode with a TV programme. It builds
on §6.5's pinned stage and goes further: every line is a step.

- **`steps.js` is pure.** A played row in, a list of screens out, no DOM. One
  screen per aired scene; one step per line (or stage direction); each step
  carries its block's `key`, who it is about (`on: {a,b,c}`) and, for a game,
  its beat. The stage, the script under it and the sidebar all read this one
  list, so they never drift. `stageOf(kind)` maps a scene kind to its SET:
  `apt` (the apartment: dictation, the send beam, the TV), `ui` (the Circle
  itself, full screen), `alert`, `arrive` (who walks in and the profile the
  room will see), and the big moments, each with its own set (`rate`,
  `hangout`, `blocked`, `room` for the visit and the finale meet, `video`,
  `studio`, `feed`, `game`, `vote`).
- **Paint step N deterministically** (`stage.js stageInner(row, screen, idx,
  fresh)`): the whole picture for "the first N lines have happened", with only
  the newest line animating. A screen is a pure function of its index, so Next,
  Back, Reveal all and Restart are trivial and nothing drifts. Never
  `scrollIntoView` inside it (that scrolled the whole page on every click);
  keep the chat's own `scrollTop`.
- **Nothing before its line.** A test renders every step of every screen of
  real seasons and checks a result is not on the stage before the step that
  says it (`tests/ci-vp-moments.test.js`, `ci-vp-boards.test.js`). The sidebar
  is gated by the steps played (`sidebar.js playedTo`).
- **Show the data behind a reaction.** A game board drew only the three answers
  said out loud, while the room reacted to everyone's ("The room is split";
  "a friend who answered the other way"). From the results step the board now
  shows every player in their column, the speakers large, the rest as name
  chips. The general rule: if a line reacts to something, that something is on
  screen by then.
- **What the row carries.** A row keeps each aired scene's script and a
  trimmed copy of its data for the sets (`season.js STAGE_DATA`, `BEAT_KEEP`):
  never the engine's state. A scene whose people differ from the day's end
  (a profile swap) carries `people`, and the screen draws it on a `rowView`
  (§11.5 V). `tests/ci-run.test.js` round-trips rows through JSON.
- **An episode, not a list of scenes.** `teasers.js` opens with "Previously",
  closes with "Coming up" / "Next time" (never a key that gives away an
  outcome); `web-stage.js` ends each episode with the relationship web and what
  moved; `debug.js` is the last screen. Sound is per step (`sound.js`: a bed per
  set, a cue on a step key). TV mode hides the chrome. Sizes are in `cqw` so a
  set scales with its frame.
- **Mockups first.** Every new set was a static HTML mockup the user approved
  (`mockup/mockup-circle-*.html`) before a line of stage code.

### 17.3 Bug classes the season reads found

Each shipped, was read in a transcript, and has a test in
`tests/ci-season-read.test.js` (or the file named).

| class | example | the fix |
|---|---|---|
| **a standing claimed before anyone has one** | "Sienna is winning this", "You're winning, and I can't let you", "harder than last time" on the FIRST ratings night | lines that claim a standing need `early: false` (a ratings night behind them) |
| **an invented default** | every roster character without an age was 25 (five players and a newcomer in one season); "from Swiss" (a nationality in the hometown field) | a steady per-person age until one is set (`profiles.js unknownAge`); `topics.js placeOf` drops demonyms and capitalizes ("Sao Paulo") |
| **a line that is true of most people and false of this one** | "You look exactly like I pictured" to a catfish walking into the finale | gate on the fact (`catfish: false`) |
| **a reveal that does not say whose it was** | a guess-game owner whose answer gave them away said only "Oh no, that doesn't sound like somebody my age" | an owner line claims the answer first |
| **the same sentence twice in a day** | "Please don't be me. Please don't be me." is written into three pools; a gift game used up its thank-yous | the same-day rule goes by words; pools a single scene can drain get more lines; measured 16 same-day repeats in 390 days -> 0 |
| **a pool too small for the cast** | three pairs of players set up their profiles with the same line (three lines for eight "best photos" players) | size a day-one pool by the cast, not by taste |
| **a hashtag that was the meaning** | "forever" | an opening hashtag is kept (17.1 #5) |
| **a talk nobody has** | a goodbye video warned the room about a player and not one chat that day mentioned it | morning-after intents (`defend`, `debrief`) built from what both saw; a goodbye warning is now talked over the same day 120 times in 124 |
| **a pronoun for a known person** | "David is someone I love, and I played as them" | the slot's pronoun (`{a.obj}`) |

### 17.4 The Season Timeline must be the engine's calendar

- **The calendar.** `ci-run.js circleShapeOf` built the timeline's days with
  `rhythmOf(cast.map(p => p.name))` over a list of NAMES: every name was
  `undefined`, so the timeline hashed a different rhythm from the one the
  engine played, and every card booked by episode ran a day early or late.
  §16.3 found the same class on Perfect Match (a forgotten option); here it was
  a type. **The guard is a test, not a review:** the timeline's days equal the
  engine's schedule for several casts and with a shared profile
  (`tests/ci-run.test.js`). Count what the engine counts (a pinned shared
  apartment is one profile).
- **Randomize books what it draws.** The Circle's Randomize used to say "the
  Circle draws its own nights" and book nothing. It now runs the engine's own
  draw (`timeline.js bookSeason`) around the cards booked by hand and writes it
  onto the timeline as cards (`ci-run.js circleRandomDraw`); a drawn season is
  `fixed`: nothing more is drawn behind the author's back.
- **Surprises are an option.** Unbooked nights draw formats, powers, identity
  twists and disrupters, like the real show. The user found that surprising,
  so CIRCLE OPTIONS has "Surprise twists": off means only what is on the
  timeline happens (`bookSeason({ surprises: false })`). Any show that draws
  unbooked twists should offer the same switch.

### 17.5 Calibration: displacement, and outcome rates are read-outs

- **A new kind of chat that TAKES a slot changes the season.** Morning-after
  chats first took the place of a player's social chats; catfish lost the warm
  chats a persona earns its edge in, and catfish winners fell from 40% to 33%.
  With every new effect switched off it was still 35%: the drop was the
  displacement, not the mechanic. Found by switching the mechanism's effects
  off one at a time through `globalThis` flags in a copied `*-audit.test.js`.
  Strategic talk now comes ON TOP of the social budget (`chat.js EXTRA_TALK`),
  with one more aired chat a day.
- **Cap what a topic can take.** A warning took four chats on the same morning;
  gossip passed a contradiction round until seven players compared notes with
  one player. One topic, or one person to compare notes with, gets at most two
  chats a day (`PER_TOPIC`).
- **Weight strategy by the strategic stat.** Game talk is 14% of the least
  strategic players' chats and 54% of the most strategic; the chill stay chill.
- **The user's rule: an outcome rate is a read-out, not a target.** Do not tune
  constants to move "catfish winners" toward the real show's 50%. Fix a
  mechanism that is plainly broken (the displacement above) and let luck and
  stats decide the rest.

### 17.6 The cast: categories filled like tribes, and characters who do not play

- The Circle's setup sorts the cast into three fixed categories (Day 1,
  Newcomers, Catfish faces) on the TRIBE field (`js/ci/categories.js`). The
  cast form's dropdown and the Cast Room's columns are Total Drama's, filled
  with this list; the shuffle tools and the tribe-balance warnings are off.
- **A character can be in the cast and not play.** A Catfish face is a real
  roster character someone plays AS: out of `_cast()`, the calendar and the
  draw; built into a persona from their profile (`ci-run.js facePersonas`,
  portrait as photo); linked to the player by a Relationships-tab row (the
  same row a shared apartment writes, so every show and later season reads
  it); recorded on the season (`playedAs`). Any show that needs non-playing
  characters (a guest, a parent, a host's pick) should use the same pattern:
  a category, an exclusion at the cast boundary, a relationship row.

### 17.7 Tools and operational traps

- **Read seasons, three at a time, on the real roster** (`rosterCast`): a
  scratch test writes `seasonText(...)` for a few seeds to files and you read
  them. Then scan mechanically: unfilled slots, `undefined`, a speaker naming
  themselves, the same line twice in a day, a speaker after their blocking,
  a debrief about something one of the pair did not see. The scans find the
  volume; reading finds the logic.
- **A test that passes first time proves nothing until the code is mutated.**
  Every fix this session was checked by putting the old code back and watching
  the new test fail.
- **Restoring files by basename collides.** `js/ci/profiles.js` and
  `js/ci/lines/profiles.js` share a name; copying both to `$TEMP/profiles.js.new`
  wrote the engine over the line pool. Save copies under their full path.
- **An apostrophe inside a quoted heredoc breaks the shell tool.** Write Python
  edit scripts with the file-writing tool, not a heredoc.
- **A background dev server can be stopped for memory** while the session is
  idle; restart it only when asked.

### 17.8 What the seventh show should do

1. Everything in §16.9.
2. If the show is mostly talk, build 17.1's order: outcome, effects, then
   words picked by facts, with a voice layer on top. Decide the picker's
   repetition rules (pair, day, words, recency, both speakers) before writing
   the second hundred lines.
3. Build the viewer as steps (17.2): a pure step list, a stage that paints step
   N, a test that renders every step of real seasons and checks nothing shows
   before its line.
4. Hold the timeline's calendar equal to the engine's with a test, and make
   Randomize book what it draws.
5. When adding a new kind of scene, measure what it displaces before you
   measure what it does.


## 18. The viewer: what five shows taught, how to port a classic viewer, and Total Drama's recipe

§6.5 is the pinned stage and §17.2 is The Circle's one-click-per-line viewer. This section
puts what The Traitors, Perfect Match, The Circle and Big Brother each learned in one place,
then gives the recipe Big Brother followed to replace its classic screens with a stepped viewer
(`js/vp-bb-ep/`). Read it before building any show's viewer, and before porting one.

### 18.1 The shape every stepped viewer shares

- **`steps.js` is pure**: a played row (the week's acts) in, a list of screens out, no DOM.
  One step is one line, one stage direction or one reveal. The stage, the script under it
  and the side panel all read the same list, so they cannot drift (§17.2).
- **Paint step N deterministically** (`stage.js stageHtml(screens, si, idx, fresh, o)`), with
  only the newest step animating (`fresh`). Next, Back, Reveal all and Restart are then trivial.
- **A ledger, not state**: what is true at step N (who is HOH, who is nominated, which votes
  are cast) is folded from the steps up to N (`ledgerAt`). Never kept in a variable that a
  repaint can lose (the `_tvState` wipe class, §11.5).
- **Three places for information, and each has its job**:
  - the **stage** is the show: who is in the room, what they do, the big reveal;
  - the **script** under it is every word, in order;
  - the **side panel** is what the viewer knows that the house does not.

### 18.2 What each show taught

**The Traitors: a stage that does not move is a slideshow.** The first Traitors stages were
rejected as static: every click has to change something on the stage (a face lights, someone
moves, a meter fills), or the stage is decoration and the transcript is the real viewer.

**Perfect Match: animate what people DO.** A kiss leans the two in and pops a heart; a big
scene pushes the camera in; the first step of a scene carries its one-shot effects. The action
is read from what HAPPENS (stage directions, the action parts), never from dialogue: "after that
kiss, there wasn't really a choice" is not a kiss. Music is per moment, with cutaways.

**The Circle: one click is one line, and nothing before its line.** A test renders every step
of real seasons and fails if a result is on screen before the step that says it. If a line
reacts to something (a board, a vote), that something is on screen by then. Mockups first:
every new set was an approved static HTML page before any stage code.

**Big Brother (2026-10): a whole house, a live show, and the minds behind it.**
- *House Life is segments, not snippets.* One screen per stretch between ceremonies, cutting
  room to room (`scene` markers on steps). Every cut opens on a time card (DAY 1 · 8:46 PM,
  BACKYARD); set pieces keep their hour, and the clock never runs backwards.
- *The camera finds the people talking.* Up to three in focus; everybody else in the room
  stands on the floor in the gaps, smaller and dimmer (never floating above the furniture).
  A loud line makes one or two of them react (a jump and a badge; a laugh shakes them).
- *Every action is animated* (`stage.js actionOf`, the Perfect Match lesson): a shout pulses
  the speaker with sound rings; a hug or a kiss leans the two in (a kiss pops a heart); storming
  off slides them out of frame; tears fall; a slam flashes and shakes; a laugh bounces; a
  whisper leans in. Read from the stage direction (who it names) or, for a shout, from how the
  line is said.
- *Title cards for the moments a viewer should never miss*: an alliance formed on screen gets
  its name slammed in with its founders' faces (the people in the scene, not the end-of-week
  membership).
- *Text has a pace.* A short line lands at once with a punch; a long one types at speaking
  pace and breathes at full stops and commas. When it is complete, names and the words of the
  game (Block Buster, veto, evict, jury) light up. A Diary Room line is a pull quote.
- *The live show is researched, not imagined.* Move-in night (groups of four on the stage
  with the host, then through the front door together) and the live eviction (the host's
  running order, a counter of ballots cast that never shows whose, "by a vote of…" held alone
  before the name, light at the front door) were both checked against the wiki first (§11.5,
  "check the wiki first").
- *Inside their heads is a side panel* (`screens.js sideHtml`): the vote's count and each
  ballot's chain (wanted → asked → told the house → cast); each House Life scene's why (what it
  is in the game, who is in which alliance, the bonds); each ceremony's reasoning (the plan, the
  pawn's answer, why the HOH turned on an ally, the holder's reasons), shown only from the step
  where the fact is public. **Record facts when they happen** (`act.bondsAt`): read live, a
  replayed week 1 showed week 5's bonds.
- *Music only where the moment earns it.* Silence is the default in the house. There is music
  under a fight, a plan coming together, a campaign, a secret and the fun moments, and nothing
  under ordinary talk. A screen asks for silence with `data-ambient="none"`, a step with
  `bed: 'none'`; otherwise the last bed (a competition's) plays on into the quiet.
- *Measure what reaches the screen.* An airing audit (every event kind: how often it fires,
  how often it airs) found campaigning and the whole vote machinery at 0%, because the director
  only aired what it could file as a storyline. Every game-moving moment now has a route, and a
  guard fails if the vote machinery drops under 70%.

### 18.3 Porting a classic viewer to a stepped one (the Big Brother recipe)

1. **Keep the classic screens, one click away, on every screen.** The switch remembers where
   you were and lands on the same screen in the other viewer (by id, then by the part of the
   week, then by the same fraction of it). A viewer that sends you back to screen one gets
   abandoned.
2. **Reuse the classic ids** for the screens the stepped viewer replaces (`bb-noms`, `bb-cer`,
   `bb-evict`…), and list them in one pattern (`REPLACED`). Twist screens not yet ported keep
   their classic version and air exactly where their act happened (`TWIST_SLOT`), with a switch
   back above them.
3. **Port one kind of screen at a time, and inventory it first.** Write down everything the
   classic screen tells the viewer (every number, every reason, every chain), and give each
   item a place: the stage, the script, or the side panel. Losing the classic screen's insight
   was the loudest complaint of the whole port ("I don't have insight into their minds like I
   had with the classic version").
4. **Render, never invent.** The engine's beats already carry their lines; the viewer stages
   them. When a screen needs words the engine did not write (the host's running order, a stage
   question), write them in a pool or with a seeded pick, true to what everybody in the room knows.
5. **Keep the transcript equal to the screen.** Every new thing the stepped screen shows (a
   personal vote, a stage answer, a walk-in) is printed by the text backlog in the same order.
6. **Test on real seasons**: render every step of every screen; fail on anything shown before
   its step; check every cue and bed exists; and audit airing per event kind.
7. **Look at it.** A harness page that imports `stage.js` and `style.js` and paints a JSON of
   steps, served on a spare port and screenshotted, caught what no test did: a reveal behind the
   nominees, a houseguest beside the Diary Room chair instead of in it, a black room. Bust the
   module cache with `import('…?t=' + Date.now())`, or the browser shows the old code.
8. **Finish the port, then measure what is left.** Big Brother's last sixty classic screens (the
   themes, the live-show twists, the secret competitions, the Split House, High Roller's money,
   Rivals, the Saboteur) went over in one pass (2026-10-16, `js/vp-bb-ep/steps-ports.js`), with a
   probe listing every classic screen still airing inside a stepped week. Only the competitions
   are left, on purpose. What the port found was not cosmetic: the stepped nomination ceremony
   turned three keys and said "three" for a block the Head of Household had filled two of (a
   Roadkill, America's or a curse's chair). A screen that stages a ceremony must know whose hand
   each part of it is (`act.roadkillChair`, `americasChair`, `curseChair`), and a power nobody
   chose (the final four's only possible replacement, `forcedReplacement`) must not be voiced as
   a choice.
9. **A secret stays in the side panel.** The house is never told who won the Hacker, Roadkill
   or the App Store; the viewer is, and only in the panel ("only you know"), never on the stage.
10. **A moment the engine plays at a ceremony belongs on the ceremony's screen.** The night the
   Head of Household's room opens had three engine events with real consequences (the room opening,
   who stays when the rest leave, the letter shared), and House Life aired about one in fifteen of
   them (phase-hoh-room: fired in 27 weeks of 33, aired in 2). They now play in their own HOH Room
   screen straight after the competition, and one file (`js/bb/hoh-room.js`) tells both the director
   and the viewer which beats those are, so nothing airs twice or not at all. Same for the veto draw:
   the engine records how each drawer felt about the name that came out (`draw[].feel`), so the face
   they make on screen is the one they made at the time, not today's bond on a replay.
11. **A painted place needs things that happen there, not only talks moved there.** Big Brother's
   island spots were only ever where a private conversation was sent (`bb/story/places.js spotFor`),
   so the bonfire, the volcano beach, the gym and the beach bar almost never aired. Events that
   happen BECAUSE of a place (`bb-events/island-life.js`: never have I ever at the bonfire, the pier
   after dark, a dare at the volcano rocks, the rope swing, the gym, the beach bar) carry a `spot` on
   the beat, and `writeEngineScene` plays them there whatever their words say. Two traps: any
   weight at all fills a week's quota (house acts have room to spare), so the cap is the rate; and
   a line that names a time of day ("all afternoon") can be clamped to 11 PM by the stretch clock,
   which only runs forward, so a daytime place keeps its lines free of the hour.

### 18.4 Total Drama's stepped viewer, step by step (the recipe to copy)

Total Drama was the first show to get a stepped viewer that covers the whole episode: camp, Tribal,
the islands, twists, the merge, the Aftermath and the finale. It lives in `js/vp-td-ep/` and
gets its words from `js/td/story/`. The designs are `docs/superpowers/specs/2026-10-06-td-stepped-viewer-design.md`
and `docs/superpowers/specs/2026-10-07-td-storylines-design.md`. To build one for another show,
follow these steps in this order. Each step names the TD file that does it.

**Step 1 — Research and mockups, before any code.**
- Look up the real show's ceremony for every setting on its wiki: what the ceremony is called,
  whether votes are handed out (marshmallows) or read out, the exit place and the exit line.
- Put the result in one table, so every screen reads it from there. TD's is `VENUES` in `steps.js`.
- Make a static HTML mockup of the camp and of Tribal, and get the user's approval first.

**Step 2 — Backdrops, then where people can stand.**
- One painted plate for each place in each setting, by day and by night. TD gets them two ways:
  - rendered in Blender: `tools/td-camp/camp.py` plus one `venues/<venue>.py` per setting;
  - cleaned from source frames, then upscaled with ESRGAN (memory `project_td_clean_plates`).
- Mark every plate with its seats, its standing spots and where the host stands (`marks.js`).
- Make a water mask for each plate, generate `wet.js` from it with `tools/td-camp/wetgrid.py`,
  and use `floorOf` / `keepDry` so nobody stands in the sea.
- Re-run `wetgrid.py` after any change to a plate.

**Step 3 — Every event is a scene with words, before the stage draws it.**
- An engine event becomes `scriptEvent({type, players, badgeText, badgeClass},
  makeScene(kind, {a, b, ...}, {ending, ...}, seenBy, spot), {ep, phase})` (`js/td/script/scene.js`).
- Keep the engine's old random draw: replace the sentence pick with a bare `Math.random()` call,
  or the whole season shifts.
- The words come later, from a script keyed on the scene's kind (§19).
- An event with no script yet airs as a cutaway with the engine's own sentence. The viewer never
  makes up words.

**Step 4 — `steps.js` is pure: the episode record goes in, a list of screens comes out.**
- `tdCampScreen(ep, camp, phase, members)` and `tdTribalScreen(ep)` turn the episode into screens.
- One step is one click: a line, a stage direction, a confessional, a title card, a marshmallow.
- Decide where each person is once per scene, from the marks (`placeScene`), never once per click.
  Otherwise somebody blinks out when they start talking.
- The people in the background come from the record (`ep.campAccess`: who was at that spot in that
  part of the day), each busy with something of their own.
- `stageSpot` maps the engine's spot to one of the setting's TV places. It keeps the same privacy
  level and never moves a scene away from a place its own lines name.
- Two scenes in a row at the same place are chained: "X heads off. Y comes over."
  (`director.js`, the run-on pass).

**Step 5 — `stage.js` draws step N, and only the newest step animates.**
- `ledgerAt` works out what is true at step N from the steps before it.
- `castAt` says who is on stage.
- `shotOf` aims the camera at the people talking, using the HD plate.
- `hudHtml` and `dialogue` draw the picture and the line.
- `intelHtml` is the side drawer, with what the viewer knows and camp does not:
  - "In their heads" (each scene's `why`);
  - Relationships (the bond changes, recorded when the event fired, never read live).

**Step 6 — Tribal.**
- **The booth:** every voter, each with the reason the engine recorded for their ballot
  (`td/story/tribal.js truthOf`). The booth order is shuffled the same way every time, and the boot
  never votes first.
- **The reading:**
  - the tally shows the count before the vote being read (`pending`), so the deciding vote is never
    on screen early;
  - the host never says "majority", because the most votes sends someone home even without one;
  - the camera is wide from the first vote, pushes in once on the deciding vote, and holds until
    the boot leaves (17.8 camera moves a Tribal became 2.8);
  - a VOTED OUT stamp.
- **After the reading:** the reveal, the room, the exit with a friend, and the after-confessionals,
  all spliced in before the boot leaves the stage.
- A setting in Intel hides the names in the booth (spoilers).
- Votes on twist nights have their own screens: revote, rocks, Double Tribal, Multi-Tribal, Save Card
  (played after the ballots are cast).

**Step 7 — Camp as a map (`map.js`), the default camp view.**
- One map per team.
- Each zone shows the faces of who is there in each part of the day.
- A speech bubble marks each conversation.
- The viewer can watch a part of the day in any order. The clock moves on only when that part's
  starred (plot-critical) conversations have been watched.
- A Next button still walks the conversations in story order.

**Step 8 — Twists, islands, the merge and the finale get their own stepped screens, in their classic slots.**
- The files are `twist-screens.js`, `twists.js`, `twists-more.js`, `returns.js`, `finale.js`,
  `aftermath.js` and `arrival.js`.
- Anything not ported yet keeps its classic screen, one click away (§18.3).

**Step 9 — Sound (`sound.js`).**
- Ambience for each setting, with weather (`weatherOf`).
- Stings for a shock, a drumroll or heartbeat under the reading.
- Lines are voiced as written (`voicing.js`, Inworld). There is no delivery director: the user
  removed it on 2026-10-14 because it slowed every voice down.

**Step 10 — The transcript matches the screen.**
- `tdStepTranscript` hands the host's calls to the text backlog.
- The backlog prints camp through `td/story/feed.js campFeed`, the same list the viewer plays.
- A scene that did not air shows as "Off camera" in the backlog.

**Step 11 — Tests, then look at it in a browser.**
- The tests: `td-vp-steps`, `td-camera-staging`, `td-stage-ground`, `td-camp-map`, `td-twist-screens`
  and `td-double-tribal`.
- Then take Playwright screenshots on a spare port. Hard-refresh, or the module cache shows the old
  code.

**Bugs this viewer shipped, and their fixes:**

| Bug | Fix |
|---|---|
| People standing in the sea | water mask, then `wet.js` and `keepDry` |
| Somebody vanishes when they start talking | one placement per scene, never per click |
| The deciding vote on the tally before it is read | the tally counts only the votes already read (`pending`) |
| 17 camera moves at every Tribal | wide shot, one push-in, held until the boot leaves |
| A replayed episode shows today's bonds | bonds recorded when the event fired |
| A Save Card played before anyone voted | played after the ballots |
| Camp words from the wrong setting (outdoor words on the jet) | `placeOk` checks every line against the setting and the time of day (§19) |
| The finale on classic screens | `finale.js`, one screen for each format |

---

## 19. Dialogue: how to build it, and how to fix it

This is the playbook for every show's spoken scenes: camp talk, house talk, chats, confessionals,
ceremony words and the "previously on" recap. It comes from building Total Drama's dialogue
(`js/td/script`, `js/td/story`), porting it to Big Brother (`js/bb/script`, `js/bb/story`), and
reading whole played seasons line by line until they read like the real show. Work out your
show's type, follow §19.2 to build, and use §19.3 and §19.4 to fix. The user's standard is
simple: "I just really need to watch Total Drama / Disventure Camp." If one line makes them
ask "what are they talking about?", it is a bug.

### 19.1 Step 0: what type of show is it?

| Type | Shows | Where the words come from | Read first |
|---|---|---|---|
| **A. Camp or house with a vote.** Events fire in the engine; a director picks what airs. | Total Drama, Big Brother, The Traitors | an engine event turns into a scene, and the scene is written from a pool keyed `long.<kind>.<ending>`; the director adds its own story scenes (vote talk, arcs, follow-ups, witnesses) | §19.2 all of it, then §19.3 |
| **B. Conversation show.** A scene is decided, then written. | The Circle | the chat's intent, then its ending, then a line picked by facts | §17.1, then §19.2 steps 3, 5–6 and §19.3 |
| **C. Panel or performance.** There is no vote. | Drag Race | the werk room events (each needs `effects`), then the panel, then the host | `docs/drag-race.md` (the three-step rule), then §19.3 |
| **D. Couples.** | Perfect Match | couple beats on the type A director | §19.2, plus `td/story/couple.js` for the beats |

Whatever the type, one rule holds: **the engine decides, the words describe what it decided.** A line
that settles an outcome, or claims a fact the record does not have, is a bug every time.

### 19.2 Building it, in order (type A; the others take the steps their row lists)

**1. The engine records what happened, when it happens.**
- Each event stores who was in it, what it decided (`scene.data`: the ending, the target, what was
  written down, the plan, who fell) and the facts at that moment (`scene.facts`).
- The words are written at the end of the episode, so they must never read live state. A replayed
  episode would otherwise show later bonds and votes that came after.

**2. Every event is a scene.**
- Use `makeScene(kind, who, data, seenBy, spot)`.
- The roles are `a` and `b` (`c` to `f` for group scenes, `h` for the host).
- `seenBy` says who knows about it. Nobody refers to something they did not see.

**3. Pools are scripts, not sentences.**
- An entry looks like `{ id, when, place, turns: [{ by, say | conf | beat | move, opt, enter, v, when }] }`.
- Pools are keyed `long.<kind>.<ending>`, with `.any` as the fallback.
- `when` only uses fact names on the whitelist. For TD that is `TD_FACT_KEYS` plus `STORY_FACTS` in
  `tests/td-story.test.js`, and a new fact goes there in the same commit.
- `false` must match exactly, so a fact you gate with `false` must be a real boolean.
- Write whole exchanges, where each line answers the one before it. Name the subject. A confessional
  says the feeling and its reason, in plain spoken English (`docs/td-dialogue-style.md`).
- Every pool has at least 2 entries with no `when`, and an ending pool that says a time of day
  ("at breakfast") has at least 2 entries. Otherwise it quietly never airs at other times.

**4. The director picks what airs** (`td/story/director.js airTdEpisode`).
- Every system offers candidates: `offer(src, tier, entry)`, where the tier is `must` / `due` /
  `story` / `colour`.
- `selectScenes` picks against a day budget (`DAY_BUDGET`). Only the chosen ones are committed
  (`commit.js`); a dropped candidate costs nothing.
- The vote talk:
  - every plan airs: ours, the other side's, the swing vote, the doubter and the target;
  - the reason for a plan comes from the ballots;
  - a callback to an earlier event ("that fight this afternoon") is used only when the event is
    between the plan's leader and its target, and only if it aired before the plan.
- The guards that run once a day, in the morning pass, over the whole day. Add to this list; don't
  reinvent it:
  - nobody who has left the game takes part in a scene (`goneBefore`);
  - no warm scene for two people who fought that day;
  - no apology on a day before the row it apologises for;
  - no making up with somebody on the day you ask a third person to vote them out;
  - the same moment between the same two people airs once a day;
  - the same two people are alone together at most 3 times a day;
  - one romance per person per day;
  - one party, one pep talk and one blow-up per camp per day; no party on the way to a vote, and no
    pep talk after a win;
  - nobody "steals the credit" for a vote they actually led.
- Places come from `places.js`: one scene per spot per part of the day, and an entry's `place:` wins.
- The multi-episode systems: arcs (`arcs.js`), the mentor, follow-ups, threads, kits, runners,
  witnesses (`witness.js`).
  - Each one remembers what it has finished (for example, the mentor never teaches the same person
    twice).

**5. The writer** (`td/story/write.js writeStory`) picks one entry, then fills it in.
- **Picking.** In order:
  1. the facts;
  2. the voice of the person speaking;
  3. the repetition rules:
     - nobody says the same scene twice in a season (`saidBy`);
     - a scene airs once a season (`uses`, and `keyUses` by its words);
     - no entry repeats within an episode (`epUsed`, `epDraft`);
     - when a needed scene has run out (`unique: 'soft'`), the one aired least comes back, and never
       one these people said or one from the last two episodes.
- **Filling in.**
  - `placeOk` refuses any line, voice variant or stage direction whose place or time words don't
    match the setting or the time of day.
  - **The set-up line** (`setup.js`): who finds whom, and what they were doing.
    - It never lists someone the scene brings in later.
    - It calls a quiet spot a secret meeting only when the talk is a secret one: votes, deals, plans
      (`hushy`).
  - **A late speaker.** An optional speaker who talks before the scene has put them in it gets a
    line first ("X has been listening", or the turn's own `enter`).

**6. The voice layer** goes on last.
- Voice tags (`td/story/voice.js`: 22 tags, plus age; personality beats age).
- A turn's own `v:` variants.
- Overlays in `lines/voices/batch*.js`. These are keyed by the turn's position, so rewriting or
  inserting a turn means re-keying them.
- Phrasebook moves (`phrase.js`, `phrases/core*.js`) for pure attitude ("agree", "pushback",
  "reassure"). A move's phrase has to make sense as a reply to anything. "Fear not!" and "what if
  we did the exact opposite?" failed that test.

**7. Ceremony words** (`td/story/tribal.js`).
- Each booth reason comes from the engine's reason for that ballot.
- Reveal, room, exit, then the last confessional, gated on what the boot did that day (`led`: they
  ran a plan, so "nobody talked to me about the vote" is out).

**8. The recap** (`td/story/previously.js`).
- Each clause names its subject the right way round. The one still trusting a betrayer is the one
  wronged.
- A quote is from the same moment the clause describes.
- "Coming for X" only when the boot really wrote X.

### 19.3 Fixing it: the season read loop (do exactly this)

1. **Dump a played season** on the real roster, to a file. Use a scratch `tests/zz-<show>-season-read.test.js`:
   - a fixed seed, a fixed cast and one setting;
   - `ONLY=<name>` to pick the season;
   - vitest hides `console.log`, so write the file with `fs.appendFileSync`.
   Each scene prints as `-- n. kind [Place · time of day]`, then its lines, so the place and time sit
   next to the words.
2. **Read one episode at a time**, as a viewer would. List every line that is wrong, with why. Don't
   fix anything while you read.
3. **Find where each line came from.** Search the repo for a distinctive phrase. It is either a pool
   entry (`lines/n-*.js`, `script/lines/*.js`, a voice overlay, a phrase) or code that adds lines
   to a scene:

   | Code | What it adds |
   |---|---|
   | `setup.js` / `write.js setupLine` | the set-up line |
   | `director.js` public reactions and crowd opener | the room's reaction to a public row |
   | `witness.js` | a witness taking sides |
   | the director's run-on pass | "X heads off. Y comes over." |
   | `previously.js` | the recap |
   | `tribal.js` | ceremony words |

4. **Fix it where it belongs**, using §19.4. Rewrite the words only when the words are what's wrong.
   When the scene contradicts the game, fix the casting, the facts or the guard.
5. **Dump again** and check that the fix aired.
   - Run `npx vitest run tests/td-*.test.js`. A single failure that passes when run alone is usually
     a timeout under load; re-run it.
   - Commit after each episode you read and push, staging only your own files.
6. **An engine change reshuffles everything after it.** Read the new version of the later episodes;
   don't trust notes taken from the old dump.

### 19.4 The bug classes, and where each one is fixed

Every row below shipped, was caught by reading, and has its fix in place. Before writing a new
pool, check every scene in it against this table.

| Class | Example | Where to fix it |
|---|---|---|
| **Something that never aired** | "you stayed up with me" about a night nobody saw; "I know what you did" (did what?) | Name the subject from `data`, or rewrite it as an everyday thing (`nly.t1`: "saving me a seat at dinner"), or say what it was ("you didn't vote with us"). |
| **No subject** | "has just done something nobody thought she could do" | Say what: "got the fire going, first try, with wet wood". |
| **Wrong day** | "day two was the worst" on day one; "after the merge" on merge day; "for days" | Facts `dayOne`, `merged: false`, `phase: 'post'`. |
| **Wrong time** | "a long, miserable day" at 8 AM; "cooler in the morning" after the challenge; "this morning" for a fight at chore time | `when: { phase }`; reword to something that is always true; a callback's time comes from the event's own part of the day ("earlier today"). |
| **Wrong place** | "crammed inside the shelter" staged on the beach; "washing up by the water" at the edge of the woods; a breakfast snub in the maze | Give the entry `place:` (`sleep`, `wash`, `eat`, `fire`...); `namedSpot` moves a scene its own lines place. |
| **A secret meeting that isn't one** | "both checking over their shoulders", then "did you sort the firewood?" | `setup.js` only uses secret openings for secret talk; a tease said to the pair's faces gets `place: 'aside'`. |
| **A speaker nobody put in the scene** | Lynda speaks in "Chris gives Anastasia, Alessio and Diego the tour" | `write.js` adds "X has been listening"; the set-up line skips anyone who arrives later. |
| **Talking to someone who left** | "Logan walks off", then "Logan, come sit with me"; "Lynda heads off", then Lynda takes a side | The room's reaction goes in before the walk-off beat; a witness is never someone the scene just sent away (`leftNow`). |
| **Lines out of order** | a bystander's confessional before the room's "oooh"; the crowd line before the scene's own opener | What a bystander says goes with the talking; what they tell the camera goes with the other confessionals. |
| **A contradiction within one day** | an apology bracelet, then "I know you didn't vote with us"; making up with Natalia, then pitching to get rid of her; "everyone stops talking when I walk up", then "people say hi to me now"; two celebrations in one day | One of the morning-pass guards (§19.2 step 4); an arc waits a day (`arcs.js`). |
| **The vote says otherwise** | the person who defends the scapegoat votes them out that night; "I thought I'd make it further" from someone who stayed; "you want Anastasia gone" to someone who wrote Alessio | Cast roles by bond (`camp-events.js crowd.lost` picks the blamed person's friend as defender); facts from `ep.votingLog` (`bWritesCarried`); the line belongs to the boot. |
| **Knowing too much, or too little** | "Of course Tristan has an Extra Vote" from the friend Tristan told; a scared decoy who had just shown his two votes | The reaction comes from the target; someone playing an Extra Vote is never cast as a scared decoy. |
| **Roles the wrong way round** | the vote's planner "steals the credit" from someone who only went along; "Tristan picked a side" when Richard voted Tristan | Skip it when `tribalStory.booth` shows the "stealer" led the vote; `previously.js` swaps the roles for the betrayal-denial scene. |
| **Repeats** | the same pitch, word for word, two episodes running; the same pair five times a day; a mentor teaching fire twice | An engine cool-down (`turnPitches`, 2 days); the per-pair and per-day caps; systems remember what they finished; for volume, use a pool-repeat probe (`zz-td-pool-repeats`). |
| **Breaking the behaviour rules** | nice archetypes running manipulation scenes | Gate on eligibility in the engine (`camp-events.js _mayScheme`), never in the words. |
| **Too clever, or a reply that doesn't answer** | "a question-shaped request"; "Fear not!"; "I am being framed!" | Plain, blunt talk that answers the line before; a phrasebook phrase must fit after anything. |
| **A voice variant that drops the word its reply picks up** | "Let's GO!" answered by "Oh, I'm bringing it"; "I keep losing my train of thought around you", then "she said I'm distracting"; "Maybe if you weren't screaming at me", then "your best lost us the daily". Every line reads fine alone; the exchange breaks only in the speaker's voice | The Challenge marks the asking turn `keep: ['bring it']`, and `tests/ch-dialogue.test.js` holds the base line and every variant to the word. Its first run found five more drops. When you write a variant for a turn that is answered, read the reply first. |
| **A pool too small for its use** | the one "took" pitch entry repeats every time it fires | Add versions with different words; until there are enough, the per-person season rule makes it repeat. |
| **A callback that names nothing** | "I've been thinking about what you told me the other day. How are you doing with it?"; "Thanks for sticking up for me the other day" two episodes after the scene | A scene that calls back to one that aired days ago says what it was: a slot for the subject (`{about}`, `director.js KIN_ABOUT`) or a recap stage direction with who, what and where (`followups.js recapOf`). |
| **A twist's ending written as a vote** | A Save Card replacement with no vote against her: "I thought I had friends in there... they had other friends too"; "I knew exactly who was voting for me"; "voted out because: personal tension". A duel won 2-0 whose last round has the winner falling in the water. The duel the boot fought printed before the boot chose the island, then "the next duel decides" | When a twist decides who leaves (a card, a duel, a swap), every line after it is written from that mechanism: who chose, and why (`tribal.js` cardSave, `exit2.card`, `after.card`). A contest's last round agrees with its result (`rescue-island.js` decided). The transcript runs in the order the night does (`_textTdRiChoice` before `_textRIDuel`). |
| **A line that assumes a relationship the two don't have** | "Tell me about home!" between allies who had shared a tribe for six episodes; "not as old teams" between two members of the same old team; "Everybody, this is Lynda" to her own tribe; "I thought you were mad at me" inside a showmance; "rests her head on Tristan's shoulder" about two allies who were not a couple; an intimidation scene between close friends, answered that night with "you two have barely been apart" | A line that needs the two to be new to each other, a couple, or enemies asks for that fact (`strangers` in `td/script/facts.js`: at most one earlier episode in one camp; `couple` in the plan talk; `showmance: false`). The engine does not hand a hostile act to a friend (`intimidation` skips bond 3+). |
| **The story written after the vote reads the game as it stands after the vote** | "That Jade went home?" the morning of the day Jade went home; the walk-out friend being the one the reveal just caught; a couple making up hours after one of them ended their deal, the night she wrote the other's name; a Vote Steal recapped as "played an idol", and its four-to-two as "three to three" | Anything the director decides from `gs` after the vote counts this episode's leavers as still here (`arcs.js` `leftThisEp`). A day's own engine moments outrank a story beat about the same two (`couple.js` sour). The recap counts what the tally counts (`voteStolen`, the thief's extra ballot) and names the advantage by its type. |
| **One pair, two moods in a day; one scene, aired twice** | Richard "Turns out Isabel is a really good person", then Isabel "Truce? For one afternoon?" / "You've lied to me" the same morning. Tristan's "Were you serious, the other day?" in episodes 6 and 8: a follow-up rebuilt its lines to add the recap beat, and the line's use, waiting on the old list, was never spent | A day shows two people one way: the second scene of the opposite tone is cut (`selectScenes` 'pair-tone', SORE_KIND / WARM_KIND). A builder that makes a new `lines` array from a written scene moves the pending spend with it (`adopt(newLines, oldLines)`, commit.js), or the scene comes back. |
| **Every fight the same shape** | every fight with others around had somebody taking a side, then a watcher's "heard every word" confessional, then "you took their side" the next morning; every loss a blame and a defence | Layers that each add a third voice stack up. Cap the stacking (`director.js sidesOncePerDay`: one fight a team a day keeps its side-takers and its watcher), gate each layer on strong feelings, and give the recurring scene a calm version picked from the people in it (`crowd.lost` 'own'). |
| **A shared voice group carries one scene's meaning onto another** | The Challenge grouped variants by meaning and hung one group on many turns: the survive call-out's "I hated saying {b}'s name, I had to pick somebody" landed on a call-out made to prove a point; "Me? Why me?" on a grudge call-out where both know why; "Easy." on an upset's winner | Before a group goes on a turn, read that turn's base line beside two of the group's lines. List every turn a shared group lands on with its base line (the scratch `sharedgroups.mjs` pattern) and cut the mismatches; those turns keep their own lines. |
| **A head count the scene doesn't have** | "Can I trust you two?" and "It's us three" in an alliance of four; "{alliance}. Just you and me." with four in the room | A group scene's size varies, so its lines never count ("you guys", "us"). `tests/ch-dialogue.test.js` refuses counts in alliance pools. |
| **The format's own words, wrong for this format** | "Don't write my name", "I know what you wrote", "They find out when TJ reads it" on a show where every vote is said out loud | Every word about the vote comes from how this show votes; a test refuses writing and reading words in the Challenge pools. |
| **A ceremony on the wrong day** | "you're going into the Arena tonight" at a vote held the day before the Arena; "untouchable tonight" after the daily, a day before the vote | Read the schedule (`season.js`: daily, vote, Arena on three days) and say "tomorrow night", "at the vote". A test refuses "tonight" in those pools. |
| **One person plays both parts** | a morning-after with one relieved player: "I slept better last night" / "Don't say that out loud", both Jake | A role falls back to someone else in the scene, never to the person already cast (`roles.js` morning-after); a scene with one person takes one-person scripts only. Tested on aired seasons. |
| **A side event the result contradicts** | "I saw Jacques stop and smell the flowers" about the day's daily winner: throwing lowers a score, but a beast can still win | When the outcome makes the event untrue, the event never happened (`dailies.js`: a winner has no throw, nobody catches one). Keep the dice rolling in the same order so the season doesn't reshuffle. |
| **A voiced quirk said twice by the same player** | "Wait, did I win? I won? I WON!" three times from one player in four episodes | The variant picker spends a variant once per speaker per season, and gives that player's next voice (or the base line) after that, never a repeat (`write.js voicedLine`; test). |
| **A confessional that airs alone, with its subject in the base only** | "I'll keep it. I keep my promises." and "I'll empty EVERY tile!" as the only line a scene aired | A confessional can be the whole scene, so every variant names its subject the way the base does. |

### 19.5 Mechanical traps when editing lines

- **Overlays are keyed by a turn's position.**
  - When you rewrite a turn, drop its overlays (a small script that deletes `id:turn` keys).
  - When you insert a turn, shift that entry's keys.
  - `tests/td-voice-overlay-align.test.js` catches an overlay sitting on the wrong line.
- **Bash heredocs halve backslashes.** `\\b` in a Python heredoc became a backspace byte in the JS.
  - Write edit scripts with the file tool, and build a backslash as `chr(92)`.
  - Check with `grep -c $'\x08' <file>`.
- **Line endings.** Many files are CRLF. Edit scripts must keep the file's line endings, and before
  staging, drop any file whose only change is line endings (`git diff --ignore-cr-at-eol --quiet`).
- **One replace per unique anchor**, never a splice at an index; assert the anchor appears exactly
  once.

### 19.6 Porting this to a new show (type A or D): the checklist

1. `js/<show>/script/`: `makeScene`, `scriptEvent`, a facts whitelist, a stable random generator
   keyed on the scene's content.
2. Convert the engine's events one family at a time, keeping their random draws. After every batch,
   check that the season's fingerprint is unchanged.
3. `js/<show>/story/`: `director` (offer, select, commit), `write` (pick, fill, set-up line,
   `placeOk`), `places`, `setup`, `witness`, `voice`, `phrase`, `previously`, the ceremony writer.
   Big Brother's `js/bb/story/` is a working port to copy from.
4. Pools in `lines/n-*.js`, written as whole exchanges, with the bug classes in §19.4 checked as you
   write each one.
5. A scratch season-read harness, then §19.3 for every episode of at least two seasons in different
   settings, then the finale.
6. The viewer (§18.4) only plays what the story wrote. Keep the backlog equal to it.

---

## 20. The shows still to build

Ranked 2026-10-14, after six shows (Total Drama, Big Brother, The Traitors,
Drag Race, Perfect Match, The Circle). Since then two rows have been built:
The Challenge (#1), and #8 as The Ridonculous Race, the cartoon version of The
Amazing Race (`ridonculous-race`, §22).

**Every show here gets a stepped viewer** (§17.2, §18), mockups first. No new
show ships on the classic column-of-cards viewer; count the viewer in the cost.

**What sets the order:**
1. **Engine fit.** Bonds, perceived bonds and a vote should DECIDE something.
   A show where only a panel, a clock or the public decides scores low.
2. **Casting.** An alumni format recasts the roster for nothing; a new cast pays
   stats, archetype, avatar and voice per person.
3. **Plays unlike the six.** A reskin of an engine we have is a mode (below),
   not a show.
4. **Popularity**, online and in France.

The old blockers on a pairs show are gone: a show that plays in its own `gs`
never touches the files that read `activePlayers` as individuals (§8.3), and
Drag Race already paid for an export with no ballots.

| # | Show | Why | Cost |
|---|---|---|---|
| 1 | **The Challenge** (*I Love Money* as a season flavour) | The franchise crossover: alumni of all six shows. A house vote sends players into an elimination duel; the vote picks who is at risk, the duel picks who leaves. Solo format first, pairs later on purpose. | Medium: its own comp library |
| 2 | **The Bachelor / Bachelorette** | The decider is a character with hidden feelings, so perceived bonds are the whole game. Alumni lead; hometowns from family ties; the Tell All from the Aftermath show. *Bachelor in Paradise* later, as a mode. | Medium: the cast must pass `romanticCompat` with the lead; count the pool first |
| 3 | **Escape the Night** | Costumed guests at a cursed dinner party; a group vote sends players into a death challenge; a mystery per season; about ten cast. | Medium: puzzle library, a plot per season |
| 4 | **Secret Story** | A Big Brother mode with its own billing; the design exists. | Low |
| 5 | **The Devil's Plan** | Logic and bluffing games, alliances, a death match; leans on `mental`, `strategic`, `intuition`. | Medium–high: a game library |
| 6 | **Star Academy** | Teachers nominate, students vote to save one, the public decides. Reuses Drag Race's performance engine (singing, dance). | High: new cast, two kinds of vote |
| 7 | **Love Is Blind / Too Hot to Handle / Single's Inferno** | Perfect Match modes: the pods; the rule-break that costs the pot; heaven and hell. | Low–medium per mode |
| 8 | **The Amazing Race** (or *Race Across the World*) | Pairs, with family ties supplying the teams. | High: an invented world map (no real geography here); little social |
| 9 | **Hell's Kitchen** | Drag Race's panel, plus a team that nominates two of its own. | Medium: cooking stats would break the nine-stat rule; decide that first |
| 10 | **Claim to Fame** | New characters who are relatives of franchise stars; the game is guessing whose. | Medium: new cast; check the real rules |

**Modes, not shows** (a registry entry on an engine we have, see below):
*Moundir et les apprentis aventuriers* and Survivor/Koh-Lanta billing on the
Total Drama engine; *The Mole* on The Traitors; *Are You The One* stays a
Perfect Match twist.

**Rejected, and why.** Pure physical or survival (Ninja Warrior, Physical: 100,
Alone, Naked and Afraid, Special Forces): nothing for the social engine to
decide. Judged talent (The Voice, Idol, AGT, Bake Off, Top Chef, Project Runway,
Ink Master, Blown Away, Is It Cake): Drag Race already has the shape, without
the drama; Mask Singer at most as a one-episode special. Docusoaps (the
Kardashians, Housewives, Vanderpump Rules, Below Deck, Jersey Shore, Selling
Sunset): life-layer material, not a game. No competition at all (Jury Duty,
Queer Eye, Shark Tank, Pawn Stars, Couples Therapy, Love on the Spectrum,
Clarkson's Farm, Terrace House, Catfish).

**A registry entry does not need its own engine.** A `js/shows.js` entry buys
the prefix, name, emoji, `words` and `audience` overlay, while dispatch in
`run-ui.js` runs an existing engine in a mode. You still pay the identity maps
(§9), `CONFIG_SCOPE`, ratings signals (§2.5) and export stamping (§5); you skip
the engine. Use it when a format wants its own billing but not its own rules.

Before building any of these, do §16.9, §17.8 and §22.9, build the dialogue by §19 and
the viewer by §18.4, and check the real show's rules on its wiki before
designing a mechanic.

## 21. Kristal-talKs exit interviews: what a new show supplies

Spec: `docs/superpowers/specs/2026-10-21-kristal-exit-interviews-design.md`.
Every boot records an exit interview the week they leave, every finalist one on
finale night; the simulator decides it and the effects are real (fans, and the
bond with each person named once that person HEARS it); `kristal.html` writes
the words after the season is published. Nothing is shown in the simulator —
the user's decision, 2026-10-21. Big Brother is the reference port.

**Shared, show-blind — reuse, do not copy:**
- `js/exit-interview/core.js` — `decideExitInterview(facts, { rng, earlier })`,
  `applyRecording(record, ops)`, `deliverInterviews(records, { at, canHear, ops })`,
  `heardAbout(records, name)`.
- `js/kristal-exit.js` + `js/kristal-exit-lines.js` — the words. Lines are
  Big Brother-voiced today (block, veto, house); a show whose exits are not
  votes needs its own `OPEN_Q/OPEN_A` kinds and cold opens added there.
- `js/kristal.js` reads `season.exitInterviews` off the seasons row; Dramagram
  pays `exitFollowerDelta` (less than a debrief, negative when the fans turned).

**What the new show writes — one adapter file, like `js/bb/exit-interview.js`:**
1. **Facts from what the guest could KNOW** the night they left: the vote count
   (not the names), who they *suspect* from their PERCEIVED bonds, the truth
   only as `flippers` (people they trusted who voted against them — the
   audience saw the ballots, Kristal plays it to them), allies/rivals still in,
   a showmance partner, and `blindside` as "they read a majority of the room as
   theirs". A Traitors Faithful never learns who the Traitors are from this.
2. **Who waits.** `canHear(name)`: out for good and not sequestered. Jurors
   record but hear nothing until the final vote is in; anybody with a return
   still open (Rescue Island, Edge of Extinction, a Battle Back camp) records
   nothing until it closes.
3. **Two hooks**: the end of every round that removes someone (and every early
   return path in it), and finale night AFTER the result and any audience vote.
4. **The ops**: the show's own popularity store and bond function.
5. **Publish**: the season document and the seasons row carry
   `exitInterviews` (decisions only; strip `heardBy`).

**A show that plays its season from a seed and airs it from a queue** (The
Traitors, Drag Race, Perfect Match, The Circle, The Challenge — every show but
the two on the shared `gs`) does not write a facts file. It adds an entry to
`AIRED_ADAPTERS` in `js/exit-interview/shows.js` (`howOf` — its door as a kind,
`ballots` if the audience saw them, `publicVotes` if the room did, `startRoom`
for the first night, `finalists`, `winners`) and wraps its "air the next row"
function with `airedEpisode(show, body, airedAdapter)` (js/exit-interview/
aired.js). Interviews are then recorded as each row AIRS, with their own dice:
nothing may reach inside a season block that re-runs by replaying it, so on
these shows the podcast moves fans, bonds and Dramagram but cannot change a
season already generated. Its door needs a kind in `core.js` NO_VOTE and lines
under `SHOW[format]` in `js/kristal-exit-lines.js`; its export adds
`doc.exitInterviews = publishedExits(show)` and its seasons-row merge passes it
on. Never start the first night from the whole cast: Perfect Match opens with
half its islanders, and somebody who has not arrived has not left.

**Measure before shipping** (what the Big Brother port measured):
- the bad-blood pair count with and without the hooks (the first draft added up
  to five feuds a season; `STANCE_BOND` was halved);
- a season read of every transcript: kinds are a mix, not all "blindside"
  (the first port read `week.nominees`, which is only written on a cancelled
  week, and called two thirds of all exits backdoors); no guest line twice in
  a season; nobody messaged, ranked or predicted who is no longer playing.

---

## 22. What the race actually found (The Ridonculous Race)

Built 2026-10-17 to 2026-10-24. The design is
`docs/superpowers/specs/2026-10-18-ridonculous-race-design.md`; the research,
decisions, identities and scene catalogue are in `docs/ridonculous-race-*.md`,
and the writers' brief is `docs/rr-writers-brief.md`. The engine is `js/rr/`,
the stepped viewer `js/vp-rr-ep/`, and the guards are the 130-odd
`tests/rr-*.test.js` (`npx vitest run tests/rr-*` is the gate before every
commit).

The race is unlike the earlier shows in three ways:
- nobody is voted out (the Boomerang vote only picks a target);
- the contestants are pairs;
- most of what is on screen is art the user made by hand: painted backgrounds
  (plates) and cut-outs for 46 invented places.

Almost every defect below was found by the user reading one leg's transcript
or looking at one screen. Very few were found by a test going red.

### 22.1 Decide what the wiki will say before the first export

The first exporter kept each leg's check-in order and the season totals, and
nothing else. When the wiki article and the awards page were built, they needed
more for every leg:
- each team's check-in time, clock, day and gap to the winner;
- every penalty, with its reasons;
- every challenge run: the side taken, who did it, the tries, the minutes, a
  switch or a quit;
- the reward, the passes, the Boomerang ballots, the sabotage, the fears and
  the injuries.

All of that existed in the finished season and was thrown away at export. It is
now read into each row by `js/rr/leg-record.js`. A season exported before that
change will never have the detail, so `tests/rr-wiki.test.js` keeps an old
document drawing without it.

**Rule:** before writing the exporter, write down the wiki's sections, the
trivia lines and the awards you want, and check that every number each one
needs is in the season document. Adding a field to the export is cheap.
Getting it back for a season already published is impossible.

- **Store ids in the record, and turn them into words in one place.** The
  record keeps machine ids like `refuse:holds` and `ditch-a-cab:seen`.
  `js/rr/record-words.js` turns them into words ("refusing a challenge"), and
  both pages read that file. A test fails if a raw id, `undefined`, `NaN` or
  `[object` reaches the page.
- **Awards come from numbers, not a writer** (`js/rr/awards.js`):
  - an award nobody earned is left out;
  - a tie goes to the team that finished higher;
  - the awards index card (`doc.awards`) travels on the seasons row
    (`mergeRaceSeasonsDatabase`), or `awards.html` shows nothing for the season.
- **Recognise the season by its data, not its slug.** Shared pages
  (`season-wiki-tab.js`, `season-awards_ref.html`) call `isRaceSeason(s)`,
  which checks for teams and for legs with a check-in order. Writing
  `format === 'ridonculous-race'` there fails the show-list-duplication guard
  (§13), as it should.
- **Every shared tab needs to be told about a no-vote show** (§0). The season
  page's Vote History tab still lists each leg as "No vote detail". Open each
  tab of the season page with your show's data before calling the export done.

### 22.2 Use every piece of art the user made, and give each one a job

- **Every plate is used, or left out with a reason.** A third of the user's
  finished plates (420 of 642) never reached the screen. Each challenge used
  one standing shot and one action angle, every Chill Zone check-in used its
  first angle, and cut-outs loaded but were never placed. The user asked "why
  did i do all that work if u dont even use them all".
  `tests/rr-vp-plates-all-used.test.js` now fails on any file in the user's
  folder that is neither used nor listed in `LEFT_OUT` with a reason.
- **A cut-out changes the challenge.** "How are u suppose to include a cutout
  of a polar bear if u dont tweak the challenge." A prop the challenge uses is
  drawn in use:
  - held in the hands (`HELD` in `js/vp-rr-ep/plates.js`);
  - carried along a path (`carry`);
  - worn (`wear`);
  - dropped on a fail (`drop`);
  - ridden (vehicle modes);
  - or placed as scenery (`deco`).

  The guards are `rr-vp-held` and `rr-vp-worn-dropped`. A vial stood on the
  ground beside the team is a bug.
- **Words and backgrounds must match.** If a line names something the
  background doesn't show, write the plate job yourself, then tell the user.
  Don't ask first. Don opened "inside a log cabin" on a snow plain, and racers
  stood on the finish mat while the course was still running. The job is
  `tools/rr-vp-jobs.json` plus `edit/<folder>/prompt.txt` with reference frames,
  then `python tools/rr-vp-repaints.py --jobs`. Use a stand-in that matches the
  words until the plate comes back, and name the job in your report.
- **A challenge has stages, from its real rules.** At first every challenge was
  arrive, one fail, done, and the user called them "super short with barely
  anything to do". Each challenge now has stages built from its real rules
  (`stages: [{id, share, risk}]`). Each stage has:
  - its own shot (`STAGE_SHOTS`);
  - at least two lines when it goes right, and two when it fails if it can go
    wrong (`tests/rr-stages.test.js`);
  - a screenshot, taken with `node tools/rr-vp-look.mjs <seed> <leg>
    stage:<id>:ok|fail` and looked at.
- **Measure how much screen each background gets.** A close-up must not be a
  challenge's only background for talk. Count each background's share of a
  leg's screens over several seasons. Anything above about 40% that is a
  close-up needs wide alternates. Later, 81 of 93 challenges still used four
  backgrounds or fewer, and the fix was new plate jobs, not new code.

### 22.3 A team is in one place at a time

The user read the Home City leg and found all of these:
- teams on the sky-deck talking to teams on the stairs;
- a judge where the challenge has none;
- snow falling indoors;
- a team checked in while its zipline was still airing;
- "every day of this race" said at seven in the morning on day one.

What fixed them:
- **Every scene has a minute and a spot.** Two teams talk only where both are
  at that minute. Where each stage of each challenge is (`js/rr/spots.js`) is
  generated from the stage shots by `tools/rr-spots.mjs`, and `rr-stage-spots`
  fails until it is regenerated after a stage changes.
- **A moment is timed by what it is.** A fear plays at the stage that frightens
  them, a pass at the end, a fail in the middle. After the clock runs,
  `settleRuns` fits each run's stages and moments into the visit they belong
  to. A try at the elevator is after the ride, not halfway through the queue.
- **A shared space records who is in it with whom, not just a capacity**
  (`js/rr/lift.js`, the sauna's rooms). A car that takes two teams at a time
  has to say which two, ride by ride, or the pairs change from shot to shot.
- **Smaller rules:**
  - no weather on an indoor background;
  - the finish mat only for teams that have finished;
  - a jump of hours on the clock shows something on screen (the overnight
    narration);
  - no history lines in the first hour, and no past-leg lines on leg 1.
- **The episode clock is allowed to go back.** A leg is cut a challenge at a
  time ("meanwhile, back at the dive"), so tests check that each team's own
  story moves forward. They must not assume the whole episode runs on one
  clock.

### 22.4 What the screen says must match what the engine did

- **When a result changes, show it at the time it changes, with the engine's
  number.** A team caught sabotaging paid twice: Don's ruling added twenty
  minutes on the spot, on top of the hour every caught sabotage sits out. Then
  the team was held at the mat and not seen again until the results card, so
  second place became eighth with nothing on screen. The user asked "we just
  passed from 2nd to 8th for no reason what happened??". Now:
  - the ruling announces the hour and adds nothing;
  - the reveal names the place the team would have had;
  - a "penalty served" check-in airs at the real time and the real place
    (`rr-penalty-told`).
- **A choice is made on screen, once, and later lines use it.** A team now
  picks its Either/Or side at the clue box (`js/rr/talk.js`
  `talkAtCheckpoint`). Lines then speak only the side it actually took, and a
  switch of sides airs.
- **Check that every pool of lines actually airs.** Three pools never reached
  the screen:
  - the failed-try lines (they were counted as a plain moment);
  - every Superteam challenge (it kept no task row);
  - a leg's first challenge never had a team finishing it on screen.

  The probe is to count aired `${kind}@${stretch}` over pinned seeds and look
  for zeros (`rr-reach`, `rr-attempt-fail`, `rr-task-done-first-task`).
- **The finale ends where the show ends.** It used to carry on after the crown,
  with the runners-up still racing. The order is now:
  1. the winners;
  2. the runners-up;
  3. the winners' last words;
  4. the host signing off;
  5. nothing after him (`rr-finale-end`, `rr-finale-after-crown`).

### 22.5 A general line names something the place doesn't have

Lines in a general pool are said at every one of 46 places, so a word that
belongs to one challenge leaks into all the others. These all aired:
- "right at the church" and a local's "No photos inside. It is sacred." on an
  ice yacht and at an outback airport;
- an oar stolen out of a boat where there is no boat;
- "Look, the rope" at a challenge with no rope;
- "we have to eat all of it?" before a zipline.

The fixes:
- **A place that has a thing says so in a fact**, like `sacred: true`, `eats`
  or `puzzle`, and lines that need it check the fact (`rr-sacred-setting`).
  Everything else in a general pool must fit anywhere (`rr-line-setting`
  checks every aired general line against the challenge's own description).
- **Each scary challenge says what the fear is about**, in `js/rr/fears.js`:
  the act (jump, drop, climb, rope, swim, creature, dark, eat and so on) and the
  stage where it happens. A fear line either matches that act or names no act
  at all (`rr-fear-act`). The root cause was that `taskType` held only the
  challenge's first type.
- **The standing rules:**
  - locals get no gendered pronouns;
  - no real place names (the World Tour rule) and no brand names;
  - nothing claims a past the season has not had ("camels again" on leg 2,
    "since the desert" before the desert).

### 22.6 Voice: the real show's transcript is the target

- **Read the real show before writing a single line.** The user pasted the
  premiere and episode 3 captions and said "this is our goal". They are kept
  in `.superpowers/reference/`, outside the repo. They showed:
  - an introduction is one partner talking in a natural run-on breath while
    the other reacts;
  - exchanges are short (2 to 7 lines) but specific to the team, the place or
    the task;
  - the mid-pack check-ins are a rapid list.

  Our first introductions gave every team the same three-beat joke, and the
  user called them "really robotic and AI". Never copy the captions close to
  word for word.
- **Check the brief against the transcript.** The writers' brief described Don
  as dry, bored and mean. The real Don is an upbeat, slick host with puns and
  jabs aimed at each team. Hundreds of lines were written to the wrong brief
  before the user caught it. Don's lines must be whole sentences with the joke
  at the end: `js/rr/script/don-flow.js` `donFlowProblem`, enforced by
  `rr-don-flow`.
- **Racers talk like people out loud.** That means plain words, contractions,
  answering the partner's last line, and at most one joke. Avoid strained
  metaphors, stacked shouts and one-word fragments. Re-read a whole batch
  before the first test run. The user had to repeat this rule, because the
  tests do not catch it.
- **Measure repeats across a season.** Repeated lines started at 57.7% of
  aired scenes and came down to 0.5%, by adding variants to the pools that
  repeated, not by deleting lines.

### 22.7 Fairness and surprise are measured, not assumed

- **Find which lever causes it before changing anything.** The team that was
  last and safe on one leg went out on the next 48% of the time, against a
  chance level of 16%. The cause was not skill: with skill nearly switched off
  it was still 29%. It was flights landing in order (the last team always on
  the last flight) and the whole check-in gap carried into the next leg.
  Widening the random luck alone made it worse (40%). Test one lever at a time
  and split the measure by what kind of leg came before. It is now 23%, held
  by `rr-unpredictable`.
- **Every team gets screen time.** The leaders had about twice the moments of
  everyone else until the Chill Zone. Now each challenge follows a different
  set of teams, and spare moments go to the team seen least (`rr-focus`).
- **Seeded tests break when content changes.** Adding a place, dropping a
  `draft` flag or editing the roster reshuffles every seeded season. A test
  that needs a rare outcome should search seeds for it, not pin one seed.

### 22.8 Tools and operational traps

- `npm run rr:read` and `npm run rr:transcript` use the audit config. A plain
  `vitest run` skips `*-audit` tests and quietly leaves an old transcript on
  disk.
- A new place carries `draft: true` until its art lands. The route never draws
  a draft, and the Season Timeline doesn't offer it.
- Whole-season tests come close to the 90-second timeout when the full suite
  runs in parallel, so give them their own timeout.
- Screenshot an unpublished season in Playwright by serving its document with
  `page.route('**/data/seasons/rr-1-data.json', …)`. Register the route again
  after the browser context resets, and save screenshots under
  `.playwright-mcp/`.
- When guards fail on files you didn't touch (other shows, another session's
  uncommitted work), name them in your report. Don't fix them in your commit.

### 22.9 What the next show should do

1. Everything in §16.9 and §17.8.
2. Before writing the exporter, write the wiki's sections, the trivia and the
   awards, and put every number they need into the season document. Test that
   no raw id reaches the page.
3. If the user makes art for the show, guard that every file is used. Give
   every prop a job in the challenge, write plate jobs yourself and tell the
   user. Screenshot every new stage and look at it.
4. Give every scene a minute and a spot. Two people talk only where both are,
   and a shared space records who is in it with whom.
5. When the engine changes a result, show it on screen at that moment, using
   the engine's own number.
6. Gate every general line on facts about the place, so no line names what the
   place doesn't have.
7. Read the real show's transcript, and check the writers' brief against it,
   before writing pools.
8. Measure what airs per pool, the repeats, each team's share of screen time,
   and how much one round predicts the next. Find the cause before tuning.
