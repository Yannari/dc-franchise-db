# Secret Story — its own show (part 1 of 4)

Date: 2026-10-27. Status: design, awaiting the user's approval.
Research behind it: `docs/research/secret-story-france.md` (all 14 French
seasons, 2007–2026: rules, every recurring twist and where it ran, each
season's signature, the house and the props).

## Why

Secret Story already runs, as a Big Brother *theme* (`secret-story`, knob
`bbSecretStory`, `js/bb/secret-story.js`, commit 813fe5283). The user wants
it to be its own franchise on the Blindside Network — own numbering, players,
wiki, records — without adding a top-level button to the site's show
switcher, and to be the real show **one to one**, not Big Brother in a
costume.

What would make it a failure, in the user's words (2026-10-27): it does not
feel like Secret Story; it is boring to read, lazy and shallow; the secret
hunt is dull; it is visually flat when it should look like a real video game
you watch; the ambience and music are not the show's; "just that it's not
enough".

## The programme: four parts, in this order

The user agreed the order. Each part gets its own design before it is built.

1. **The show itself** — this document.
2. **The game** — the secret hunt in depth (clues, tells, suspicion, the
   buzz and its confrontation), La Voix as a character, the prime and its
   dilemmas, the red phone, missions and fake romances, launch night and the
   finale as events, and the twist catalog with its randomizer.
3. **The writing** — house life written for Secret Story at Total Drama's
   depth: secrets, suspicion, missions, romance and fake romance, the Voice.
4. **The look and the sound** — the stepped viewer; plates of the Secret
   Story house drawn in Total Drama's style with the show's props (the user
   will need precise references of both, delivered as to-edit folders with
   prompts, the BB resort-plates workflow); the real music, supplied by the
   user as recordings.

### Already decided for later parts (recorded here so it is not lost)

- **Every season is different.** Secret Story seasons each have a signature
  twist, as the real ones did. A catalog holds the twists; a randomizer
  places each where it belongs in a season. Recurring tools (the red phone,
  the secret room, switch cards…) may appear every season, as on the real
  show. What may never repeat is the *feel* of a whole season: the
  randomizer scores a draw against every past Secret Story season
  (signature, tools in play, when each lands, missions, prime themes) and
  redraws above a ceiling. (Part 2.)
- **Gendered nominations are a season setting**, not a law: the randomizer
  picks classic opposite-sex or mixed per season; the user can force either.
  The revival seasons dropped them. (Parts 1 and 2.)

## Part 1: goals

1. Secret Story is its own registry entry and plays on the Big Brother
   engine, the way Drag Race All Stars plays on Drag Race
   (`docs/ADDING-A-SHOW.md` §23).
2. It is filed under Big Brother on the site: one family button, a second
   tab row `Big Brother | Secret Story`.
3. It owns its words, its careers, its wiki and player pages, its records,
   its calendar slot and its rankings board.
4. The cast is mostly newbies, with a few returning faces.
5. Every housemate has a secret on the cast screen before the season starts,
   and a newbie's personal secret becomes permanent canon for that
   character.
6. The Big Brother theme `secret-story` is retired; v1's working parts move
   to the new show.
7. Each season carries an identity: a number, a name and a house theme.

## Non-goals of part 1

- The depth of the game (part 2). Part 1 must leave v1's game *working* on
  the new show — a season plays to a winner — but does not deepen it.
- New writing (part 3), new viewer screens, plates or music (part 4).
- Scoring the rankings properly: the board exists, with a provisional rubric
  marked PROVISIONAL, priced after part 2 exports its numbers
  (`docs/ADDING-A-SHOW.md` §24.2: measure before pricing).

## Anti-goals

- A Secret Story season that says HOH, veto, jury, "evicted by the house" or
  "houseguest" anywhere a player can read it.
- A newbie's secret invented silently and stored without the user seeing it.
- A character's canon secret changing after their first season.
- A Big Brother season that is half Secret Story.

## Decisions the user made

| decision | detail |
|---|---|
| own show, Big Brother family | own wiki, players, numbering; tab under Big Brother, not a new top-level button |
| cast | a mix, "mostly often newbies" |
| newbie secrets | drawn from a written pool by default, shown on the cast screen to keep, reroll or replace with your own; your own needs a kind picked so it has clues; canon once the season starts |
| returning faces | secrets from their real history (v1's kin pairs and careers), as the real show did (S9's "I'm a former candidate") |
| roles from the Voice | fake couple, fake siblings, impostors, accomplice, thieves… are missions, not biography; never stored on the character |
| gendered nominations | optional, a season setting |
| variety | recurring tools may recur; whole seasons may never feel the same (part 2) |

## The show, concretely

### Registry (`js/shows.js`)

```
'secret-story': {
  prefix: 'ss', name: 'Secret Story', short: 'SS', emoji: '👁️', accent: <pick, not BB's #38bdf8>,
  engine: 'big-brother', family: 'big-brother', familyTab: 'Secret Story',
  runnableFlag: '_bbRunnable',          // same run loop
  airNight: <a night BB does not use>, airSlots: ['summer'],
  rosterPlace: 'HOUSE', hasJury: false,
  roundsPath: 'bb.weeks', roundShape: 'weeks',
  words: { player: 'housemate', players: 'housemates', round: 'Week',
           exit: 'eliminated', exitAction: 'eliminate', milestone: 'semi-final',
           seasonComplete: 'The season is complete. The public has chosen.',
           quietRound: 'A normal week in the House of Secrets',
           fanWords: ['secret','buzz','kitty','la voix','prime','sas','nominated','confessional','clue','mission'],
           comp: 'game', comps: 'games won', audienceAward: … },
  careerStats / articleStats: secrets found, secrets kept to the semi, buzzes right/wrong,
           kitty banked, times nominated, missions won — read from what v1 already records,
           extended in part 2.
}
```

Parent `big-brother` gains `familyTab: 'Big Brother'`. No `spinOff.after`:
Secret Story is not "after Big Brother season N"; it has its own summer slot
from its first season (my call). `nextWindowFor` already treats a show
without `spinOff` as its own rhythm, filtered by `seasonRowFormat`, so
Secret Story rows must carry `format: 'secret-story'` and Big Brother's
rhythm must not count them.

The words above are a draft; the vocabulary guard (`tests/show-vocabulary`)
is what proves them.

### The engine split

The Big Brother engine is reached by **226 checks of `'big-brother'` or
`BB_FORMAT` across 52 files** (re-derive with `grep -rn "'big-brother'\|BB_FORMAT"
js worker`). Each must be classified, as §23.7 step 1–2 did for Drag Race:

- *is this the Big Brother ENGINE?* → `engineFormat(config) === BB_FORMAT`
  (rows stamp the engine: `ep.format === 'big-brother'`);
- *is this the Big Brother SHOW?* → `seasonFormat(config)` / the season doc's
  `format`;
- *is this careers/site filing?* → `familyOf()`.

Secret Story mode is no longer a knob: `ssOn()` becomes "this season's show is
`secret-story`". `bbSecretStory`, `themes-secret-story.js` and the theme's
entry in `js/bb/themes.js` are removed; a saved season that still carries the
knob loads as a Secret Story season (the DRAS `drAllStars` legacy pattern),
or is refused with a sentence — the builder checks whether any such save
exists before choosing.

Big Brother themes do not apply to Secret Story; Secret Story's season
identity (below) takes their place.

### Season identity

Every season has a number (`ss-1`), a **name** and a **house theme** — the
real house was redecorated every year (Michèle Sarfati's sets; the rooftop
chalet; the campus; the 2024 warehouse with its arena). Part 1 stores
`seasonConfig.ssName` and `seasonConfig.ssHouseTheme` (an id from a short
list in a new module); part 2's randomizer will choose them with the
signature twist, part 4 will draw them. Until then the setup screen offers a
plain picker and a "random" option.

### Casting

- Gender is required for every housemate (the roster carries `gender`
  `m`/`f`/`nb` for 272 entries; the cast screen refuses a cast it cannot
  nominate when the season's nominations are gendered, with a sentence).
- Cast size 15–18 by default (the real seasons ran 15–20).
- **The secret column on the cast screen.** Each housemate shows their
  secret. Returning faces: the real-history secret v1 already derives (kin in
  the house, a past win or career). Newbies with a canon secret: theirs,
  locked. Newbies without one: a draw from the pool that fits them, with
  Keep / Reroll / Write my own. Write my own asks for a *kind* (the pool's
  categories) so clues and tells can be generated.
- Voice roles (fake couple, fake siblings…) stay v1's job at season start
  and are shown as roles, not secrets.

### The personal-secret pool

A new data module (e.g. `js/ss/secret-pool.js`). Each entry:

```
{ id, text,            // "I survived a plane crash"
  kind,                // survived · talent · job · body · family · record · past-life · belief · …
  fits(player) | tags, // age, archetype, stats, gender where it matters
  clues: [3–5 objects or words],   // a cassette, a leopard scarf, "Serrure"
  tells: [behaviours that leak it],
  difficulty }
```

Written in the real show's spirit, never naming a real celebrity, brand or
real-world place (a "famous footballer", never a real one — the no-brands
rule). Target: enough personal secrets that three full casts of newbies never
see one twice (≈ 60); a drawn secret that becomes canon is retired from the
pool for everyone else (my call). The pool is written properly in part 3;
part 1 ships the module, the shape, the draw and a first batch large enough
to cast a season.

### Canon: the secret on the character

When a season starts, each newbie's personal secret is written to the
character as authored data: `player.secret = { text, kind, clues, tells,
firstSeason: 'ss-N' }`.

- It is AUTHORED, so it lives in the D1 `roster` table (a new column) and
  the Casting Studio shows it read-only once set. `rosterPublish()` rebuilds
  `franchise_roster.json` wholesale from D1, so a field that never reaches
  D1 is deleted by the next Publish — this has destroyed authored data twice
  (memory: publish wipes authored fields). The write path, the column and
  the publish must ship together, with a test.
- Today only the Casting Studio writes the roster (`js/studio.js`, the
  token in `localStorage['studio_api_token']`). My call: the season start
  writes through the same token-guarded upsert when the token is present
  (same browser); when it is not, the secrets ride on the season export and
  the Studio lists them as "canon secrets waiting" with one Apply button.
  Either way the user sees what was written.
- Once set it never changes. A later Secret Story season with the same
  person treats it as already known (a returning face).
- The wiki, player page and trivia read it ("Their secret: …, found by X in
  week 3" or "kept to the semi-final").

### Careers, records, wiki, rankings

- A Secret Story win is a full win, filed under Secret Story
  (`byShow['secret-story']`), and appears under the Big Brother family on
  the site.
- Rankings: **its own board**, `rankings_ss.json`, with its own rubric —
  my call, and a departure from §23's "one board per family", because the
  family rule was written for a spin-off that plays the same game. Secret
  Story scores different currencies (no HOH, no veto; secrets found and kept,
  kitty, public votes). `BOARD_FILES['secret-story']` is read before the
  family fallback already; `RU_SHOW['secret-story']` must be declared so the
  alias loop does not hand it Big Brother's rubric. Provisional until part 2.
- The `players_database` merge, seasons rows, records and the wiki must file
  `ss-N` under its own show and its family, as DRAS did (§23.3–23.4).

### On the site

- The switcher draws `Big Brother | Secret Story` (§23.6 already supports
  this).
- The season pages show the **secrets board**: every secret, its holder,
  found or kept, by whom, when and for how much. The audience always sees all
  of it, as viewers did from launch night.
- The worker imports `js/shows.js` and must be redeployed (`npm run deploy`)
  before the first `ss-1` publish.

## Order that should work (from §23.7, adapted)

1. Registry entry + family tab; run every registry test against a baseline
   taken first.
2. The engine split: classify the 226 checks; `ssOn()` from the show; retire
   the theme and the knob.
3. Export, merges, ledger record, file paths, exporter dispatch for `ss-N`.
4. Casting: gender, the secret column, the pool module and first batch,
   Keep / Reroll / Write my own.
5. Canon: D1 column, Studio, publish, the write at season start, a test that
   a publish keeps it.
6. Careers, records, wiki, trivia words, rankings board (provisional).
7. Calendar slot; the switcher; the secrets board on the season page.
8. Play a season off real data, read the export and the screens, grep every
   generated sentence for Big Brother's words.

## Left to the builder

- The emoji, accent colour and air night.
- The exact category list for `kind`, the first batch of secrets.
- Whether a legacy `bbSecretStory` save is converted or refused (check if
  one exists).
- How the secrets board is laid out on the season page.

## Open for later parts (not for part 1)

Launch night as an event, the finale ceremony (every evicted housemate back
for 24 hours, families, last winner hands the cheque), the opening titles
with the Voice's line ("Ils ont tous un secret… méfiez-vous des
apparences"), the prime, and life after the show — parts 2 and 4.
