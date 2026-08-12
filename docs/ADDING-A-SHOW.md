# Adding a show to the simulator

Everything you have to touch to add a third show, in the order that keeps the
site working at every step, with the traps named where they live.

Written against the codebase as it stands after Big Brother. Big Brother was
added *without* this document, and most of what follows is the shape of the
mistakes that were made doing it — the ones that only surfaced weeks later, on
a screen nobody thought was show-specific.

**The one-line summary:** the registry in `js/shows.js` is the source of truth,
about twenty modules already read it and need nothing from you, and everything
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
vocabulary, and about twenty modules read it.

```js
'ridonculous-race': {
  prefix: 'rr', name: 'Ridonculous Race', short: 'RR', emoji: '🏁',
  words: { player: 'racer', players: 'racers', round: 'Leg', exit: 'eliminated' },
  careerStats: [
    ['challengeWins', 'totalLegWins'],
    ['votesReceived', 'totalPenalties'],
  ],
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
| `seasons_database.json` | one row per season, carries `format` |
| `players_database.json` | `seasonDetails[].format` — **absent means Total Drama** |

That last one is the quiet trap: an appearance with no `format` is Total Drama,
so if your export forgets to stamp it, a racer joins the Total Drama career of
whoever shares their slug.

---

## 9. The duplication you will hit

These files each hold their own copy of the show list. Every one of them is a
place a third show can be forgotten, and none of them will error — they will
just describe your show as Total Drama.

| File | What it duplicates |
|---|---|
| `player.html` | four maps: `SHOW_PREFIX`, `NAMES`, `ICONS`, `SHOW_NAMES`, plus a hardcoded `['total-drama', 'big-brother']` fallback list |
| `js/wiki.js` | `SHOW_NAMES` |
| `js/wiki-view.js` | `SHOW_META` (name, short, emoji, accent) |
| `js/social/adapter.js` | `SHOW_WORDS` (deliberate — vocabulary, not identity) |
| `current-season.html` | `CS_SHOWS` prefix map |
| `compare.html`, `franchise.html` | label maps |
| `js/settings.js` | venue list per format |
| `js/alumni.js`, `js/rankings-update.js` | format lists |
| `worker/worker-season-live.js` | `SHOW_WORDS` fallback |

**Recommended before you start:** collapse the pure-identity ones (names, icons,
prefixes) into `js/shows.js` and import them. That is roughly an hour, it is
mechanical, and it converts nine chances to forget your show into zero. Keep the
vocabulary maps separate — `social/adapter.js` is right to own its own words.

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
8. **AI fills** (§7) last — they are the only step that costs money per run.

---

## 11. Guards worth adding on the way

The existing ones that will already catch you:

- `tests/format-scoped-config.test.js` — a control is shown only where the
  engine reads it
- `tests/show-switcher.test.js` — the switcher holds no show list
- `tests/season-format.test.js` — the export adapter matches the engine's shape
- `tests/wiki.test.js` — each show's article uses its own vocabulary

**Add one guard the codebase does not have yet:** a test that renders a season
page and a character article for *every* registered format and asserts that no
other show's vocabulary appears in the output. An allowlist-style guard once let
five twists ship with no VP screen at all; the same class of hole is what lets a
new show inherit the default show's words on one screen out of twelve.

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
