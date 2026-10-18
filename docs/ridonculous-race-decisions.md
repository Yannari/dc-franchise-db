# The Ridonculous Race: decided so far

Running list of the user's decisions while the design is being talked through. The full design is written after the
episode-by-episode read of the Ridonculous Race and the Amazing Race; this list feeds it. Identities, task types and the
stat blends live in `docs/ridonculous-race-identities.md`.

## What the show is

- Each episode is one **leg**. The core is what happens during the race: tasks, strategy, social play, sabotage. Close to
  1:1 with the real shows; nothing left out.
- A different kind of show from the other six: **teams are in different places doing different things at the same time**,
  and they cross paths (flights apart, bottlenecks, the second wave catching up at a slow task).
- **Strategy is helping and hurting each other**, not voting: help across teams, sabotage, Boomerang (U-Turn), deals.

## Setup

- Cast built in the **Casting Room**, teams of two by drag and drop (the same tab The Challenge uses for pairs).
- Per team: a **relationship** (parent-child, siblings, cousins, married, dating, exes, BFFs, grandparent-grandchild,
  coworkers, roommates, rivals, reality-show vets, enemies) and optionally an **identity** (54 built-in + custom).
- Per person: archetype and voice as usual.
- **Bonds** inside a team: friendship or romance. Romance only between people who are not family, and it can be one-sided
  (Carrie → Devin). Bonds across teams work the same way.
- Everything else (route, legs, twists per leg) the design proposes.

## Money

- **Money is in** (2026-10-18), with **begging and money penalties**, like The Amazing Race: a cash envelope each leg,
  spent on everything but flights; running out means begging, selling, borrowing; non-elimination legs can take it
  all.

## Stats

- **No new stats.** Task types are blends of the nine. Temperament is volatility (spread), not grit (level), except where
  steadiness is the job (BB library rule).
- **Teamwork** = bond + relationship, **domain skill** = identity, **luck** = random travel events (never a stat), all
  three important.

## The viewer

- A **linear** stepped viewer, VN-style, one line per click, avatar icons (no full-body sprites). No map of events to pick
  from. Keeps intel, the full-screen player and going back; some parts can be separate screens.
- **Every team is seen doing every task.** No fast-forward for the late teams.
- A team that is too far behind and last: **the leg ends for them where they are** (Don comes to them), no pretending
  they are still in it.
- **Suspense in close races**: the order is not given away before the mat. Intercut the teams that are close, the
  footrace to the mat, Don's pause before the placement.
- A reality show, not a photo album: **wide for action, close-up only where a line earns it**, idle motion on every
  avatar, people placed and **sized for what they are doing** (seated in the plane, two per row; switch scene rather
  than shrink people). Nobody talks from off screen.
- Confessionals as the show shoots them: **the pair side by side in front of the dark map**, compass rose, green name
  bar on the team's first confessional; solo when the subject demands it.
- Title cards in the **logo's look** (stained-glass globe, black band, blue neon edge, orange letters).
- **Every plate of a place gets used** as a stretch of the route when it makes the task longer or more interesting.
- **Alive plates** everywhere (the TD motion-map shader), and **sound per place** (Hawaiian music and waves on an island,
  crowd noise in a city), from recordings the user downloads.

## Writing

- Human dialogue, strong characterization, **no clever lines** in the stepped viewer. Lines answer each other.
- Don is a dry host, not an announcer.

## Follow

- `docs/ADDING-A-SHOW.md`, knowing this is a new kind of show.
