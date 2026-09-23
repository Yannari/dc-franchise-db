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

## Phase 2 — arrival rules

New arrivals get first pick at the recoupling (UK 9, 10, 11, 13; US 8) ·
stand-up steal (UK 12 d24, US 7 d3, US 8 d3) · the bombshell saves one of two
singles (UK 12 d9, US 6 d27, US 8 d10) · the public couples the bombshells
(US 7 d11, US 8 d10) · first-coupling formats: profiles on podiums (UK 12),
public-picked (UK 10), a "most to least" ranking (UK 11), doors (US 8).

## Phase 3 — one-off twists (at most once a season)

Returning islander (UK 10 Molly, UK 12 Blu and Megan) · the host's secret
mission to dump two, who get a second chance (UK 13 d3) · the sleepover villa
(UK 12 d15–17) · immunity from a challenge (US 8 karaoke).

## Phase 4 — the challenge pool

Got the Receipts · Look Who's Talking · Couple of Sorts (guess the public's
ranking — information from outside) · Sauciest Snogger · Couple Goals · the
talent show · the baby dolls · Knowing Me Knowing You · the Grafties.

Every twist is a scene with real dialogue in the Plan 3 style, has a
consequence (bonds, beliefs or approval), and is shown on its own screen.
