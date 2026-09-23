# Perfect Match — Plan 4.5: the twist catalogue

**Why.** Every season ran the same sixteen episodes in the same order: one
first coupling, the same two public votes, the same five rituals. Read against
eight real seasons (UK 5, 9–13; US 6–8, from the Love Island wiki's coupling
notes and weekly summaries), the engine had about a third of the formats the
show actually uses, and a second season would have had the first one's shape.

**Rule.** A fixed SPINE, and slots drawn per season from the catalogue,
weighted by how often the real show does each thing. The draw is its own
stream (`streamFor(seed, 'schedule')`), so a season's shape never moves
another draw, and the run tab's episode map reads the same drawn schedule.

## The spine (never drawn)

First coupling (ep 1) · Casa Amor (open / nights / stick or twist, eps 8–10) ·
the photos (ep 11) · semi-final (ep 14) · final (ep 15) · reunion (ep 16).

The episode KINDS stay where they are — recoupling, bombshell and public-vote
episodes on the same numbers — so the number of dumpings, and with it the
season's calibration (exits ≈ 14, four couples at the final), does not move.
What is drawn is HOW each one plays.

## Phase 1 — dumping formats (this commit)

Real formats, with the seasons they were read from:

| id | what happens | seen |
|---|---|---|
| `public` | the public's bottom couple goes | UK 9 d26, UK 12 d51, US 6 d27 |
| `cross-gender` | public bottom per side; the other side dumps one each | UK 10 d12, UK 11 d10, US 6 d11 |
| `safe-pick-couple` | public bottom couples; the safe islanders pick one | UK 10 d52 |
| `top-couple-picks` | public bottom couples; the public's FAVOURITE couple picks who goes | UK 9 d45, UK 11 d44, UK 12 d35, UK 13 d33 |
| `save-one` | the public's bottom boys (or girls); the other side saves one | UK 9 d19, US 8 d10 |
| `couples-vote` | no public: each couple names the least compatible couple; the two named most are at risk and the safe islanders pick | UK 10 d16, UK 13 d18, US 8 d25 |
| `ex-islanders` | the semi-final: couples name the least compatible, and the dumped islanders come back to decide | UK 11 d55, UK 12 d56, UK 13 d46 |

Draws: ep 5 from `cross-gender` / `top-couple-picks` / `save-one` / `public`;
ep 12 from `safe-pick-couple` / `top-couple-picks` / `couples-vote` / `public`;
the semi-final from `public` / `ex-islanders`.

The ex-islanders vote from what they lived: friendship, and a GRUDGE against
whoever voted them out or the partner who moved on. Never approval.

### Phase 1 — shipped, and what reading it found

Sixty seasons: every format plays; exits 14.6 a season and four couples at 73%
of finals (72% before — the calibration held, as the spine was meant to keep
it). The ex-islanders' vote plays in ~27% of seasons: it needs five or more
couples at the semi-final, and a drawn night that cannot happen records
`dumpFormat: null` rather than claiming it did.

Defects found by printing the nights and reading them, each now a guard in
`tests/pm-dump-formats.test.js`:
- **Dior read the verdict before the votes** (every villa-decided format,
  and the old ones too): "the count is clear" before a single ex had voted.
- **A boy saved somebody else's girlfriend over his own**: the vote had no
  term for your own partner. It does now, for every format.
- **"X is the only one still standing" over five people standing**: several
  singles now hear one verdict together, with fewer goodbyes each.
- **"The public have voted" over singles nobody voted on** at the semi-final.
- A couple dumped together heard Dior's line twice, once each.
- A couples' vote night was titled "Public vote"; titles follow what played.

### The cast decides the season's length

User: "freedom of the cast — a minimum but no maximum", and "automatic, with an
option of setting it myself". The fixed sixteen episodes had six arrival
slots; a seventh bombshell never walked in, and a 40-islander Casa arrived in
one night of 24.

`buildSchedule({ bombshells, casa, episodes })` builds the season from the
spine: every bombshell pair past six adds a week (an arrival, then a dumping
— every second one a public vote), alternating before and after Casa. The
22-islander cast builds EXACTLY the sixteen episodes the season was tuned on
(`tests/pm-schedule.test.js`). A set length packs arrivals into fewer nights
or adds quiet recoupling weeks; the spine is the floor (11 with Casa).
Default roles scale with the cast (`defaultRoleSplit`: 10 / 6 / 6 at 22).

THE PACE. Each dumping night reads how many islanders the villa still has
to lose to reach four couples, over the dumping nights left: a recoupling
dumps nobody under half an islander a night to spare, and more on a short
season; a vote night needs about one, and a villa already at four couples
keeps them — unless it has singles nobody is left to arrive for, who then
face the public (`singles`). Measured over twenty seeds each, four couples
at the final:

| cast | length | four couples | note |
|---|---|---|---|
| 8 | 11 | 9 / 20 | every islander must couple for four |
| 12 | 12 | 10 / 20 | |
| 16 | 14 | 18 / 20 | |
| 22 | 16 | 18 / 20 | the calibration cast; audit 92% |
| 22 | 12 (set) | 20 / 20 | ~10 go at the semi-final at once — the hint says so |
| 22 | 22 (set) | 9 / 20 | long seasons lose more to walks |
| 30 | 20 | 20 / 20 | |
| 40 | 28 | 20 / 20 | |

Found by reading a 40-islander season: eleven Casa entrances from four lines
(now four solo entrances and a group per villa), and a couples' vote that put
only the three NAMED couples at risk, so the semi-final could not trim eight
couples to four (the unnamed weakest now fill the places).

## Phase 2 — arrival rules

New arrivals get first pick at the recoupling (UK 9, 10, 11, 13; US 8) ·
stand-up steal (UK 12 d24, US 7 d3, US 8 d3) · the bombshell saves one of two
singles (UK 12 d9, US 6 d27, US 8 d10) · the public couples the bombshells
(US 7 d11, US 8 d10) · first-coupling formats: profiles on podiums (UK 12),
public-picked (UK 10), a "most to least" ranking (UK 11), doors (US 8).

### Phase 2 — shipped

- **New arrivals pick first** at every recoupling after they walk in: the
  norm, not a twist (UK 9, 10, 11, 13; US 8 say it in those words).
- **Bombshell nights** draw one of: just dates (usual), stand up to be chosen,
  the bombshell saves one of the singles, the public couple the bombshell —
  never the same rule twice a season (`ARRIVAL_DRAWS`).
- **Night one** draws step forward (usual), dating profiles, the public's
  couples, or most-to-least (`FIRST_DRAWS`).
- All of it is catalogue twists (Dumpings / Arrivals / Night One) booked on
  the Season Timeline, each refused on a night of the wrong kind. Nothing needs
  booking: an unbooked night draws. The timeline's **Randomize** stamps a
  whole drawn season onto the timeline to read and edit (user: "I don't know
  when to schedule a twist — should we have a preset?").
- The timeline's villa counts are projected on the season's pace (they read
  the cast size on every episode before).

Sixty seasons: exits 14.1, four couples at 95% of finals (audit). Found by
reading: two bombshells arriving the same night stood up for each other
(tonight's arrivals are now apart), and night one's pools were too short for
five couples.

## Phase 3 — one-off twists (at most once a season)

Returning islander (UK 10 Molly, UK 12 Blu and Megan) · the host's secret
mission to dump two, who get a second chance (UK 13 d3) · the sleepover villa
(UK 12 d15–17) · immunity from a challenge (US 8 karaoke).

### Phase 3 — shipped

At most two a season (`ONE_OFF_DRAWS`, drawn after everything else so no
earlier draw moved), or booked on the timeline:

- **Returning islander** (30%): a dumped islander the public most want back
  walks in single, before the night's moment — so at a recoupling they pick
  first. Their ex (and who the ex is with now) and whoever voted them out are
  still there. Chosen in arrivals.js, the ledger reader, because it is the
  public's choice.
- **The secret task** (15%): a new arrival is told to dump a boy and a girl,
  names them at the fire pit, and the two get a second chance. Nobody leaves;
  the bonds pay for it. ("Task", not "mission": the vocabulary guard keeps
  the castle's word out of the villa.)
- **The sleepover villa** (20%, nights with 2+ arrivals): each arrival takes a
  coupled islander away for two nights; each chooses to stick or twist. An
  arrival nobody chose is dumped.
- **Immunity** (25%, vote nights): a couples' challenge on stats; the winners
  cannot be at risk in any format.

Sixty seasons: exits 14.4, four couples at 59 of 60 finals; audit 95%.
Found by reading: the secret task's text arrived "before they walked in",
after they had; the sleepover's nights reused the date pool, so a pair had
the same exchange twice in one episode (it has its own scenes now).

## Phase 4 — the challenge pool

Got the Receipts · Look Who's Talking · Couple of Sorts (guess the public's
ranking — information from outside) · Sauciest Snogger · Couple Goals · the
talent show · the baby dolls · Knowing Me Knowing You · the Grafties.

Every twist is a scene with real dialogue in the Plan 3 style, has a
consequence (bonds, beliefs or approval), and is shown on its own screen.

### Shipped

Read from the challenge tables of UK 10-13 (loveisland.fandom.com): the
kissing challenge, Couple Goals, the partner quiz and a guess-who-it-was card
game are in all four; the talent show in three; Couple of Sorts in two; the
baby dolls and the Grafties in one each.

- `js/pm/challenges.js` — the nine games. The afternoon of a villa day (not a
  Casa day, not the first coupling, the final or the reunion; never the
  heart-rate or Snog Marry Pie day). It plays between the day and the
  evening from its own stream (`chal:N`), so the evening and the night are
  decided on what it brought out. Every game opens with the text that starts
  it (`challenge-text`, with its hashtag).
- `schedule.js` `CHALLENGE_DRAWS`: each drawn with the chance and at the point
  in the season the four seasons played it, one a day, each at most once,
  drawn LAST so no earlier draw moved (held against commit 1429d091's draws
  in `tests/pm-challenges.test.js`). `CHALLENGE_NAMES` names the screen.
- Timeline: nine catalogue twists under **Villa Challenges** (`pmApply:
  { challenge }`), all mutually incompatible; Randomize stamps them. A game
  booked on one night is taken off the night it was drawn for.
- Couple of Sorts and the Grafties bring the public's view in: the ranking is
  `publicSorts` / `publicAwards` in public-vote.js (a ledger reader); what the
  islanders make of it is in challenges.js, which reads no approval.

What each one does: receipts read a secret out to the partner (one a game)
and a wrong guess is a kiss in front of yours; Look Who's Talking quotes a
beach-hut line that NAMES somebody still in the villa, from an earlier day,
and they learn what the speaker really feels; the Snogger's scores are heard,
and the biggest gap (two points or more) is the row; Couple Goals costs the
namers resentment, more from friends, and the closest friend gets the
confrontation after the game; Knowing Me moves every couple by its score, and
"who is more likely to stray" lands as guilt or hurt; the talent show's
show of hands exposes a partner who voted elsewhere; the baby dolls show who
did the work; Couple of Sorts' last place costs security and the less
invested partner's interest; the Grafties' grafter award worries a partner.

Measured, 100 seasons of the default 22: per season receipts 0.77 · Couple
Goals 0.80 · Knowing Me 0.70 · Snogger 0.88 · talent 0.47 · Couple of Sorts
0.35 · Look Who's 0.40 · baby 0.14 · Grafties 0.04. Audit against the commit
before: exits 14.5 → 14.4, four couples at the final 95% → 97%, 0 jumps,
invisible share 14.0% → 13.8%, repeated lines 5.9% → 5.6%. Casts of 10, 16
and 30 play them too (small casts rarely reach the late ones).

Found by reading: every receipt in a game was the same secret line, and a
game could expose four affairs at once; the subject's own partner could be
the one guessing; "Nine" printed over an eight; "nearly every board" over two
of five; Look Who's Talking said "that's about me" over a quote that named
nobody, and called a cold line sweet; the Couple Goals confrontation landed
between two questions; the Snogger had a row in 160% of games (it is one
now, the biggest gap); the dolls' "we lost the baby" outnumbered couples who
managed.
