# Coaches Twist — what is left

The engine is built, reviewed and measured across 20 headless seasons. This is
what a final whole-branch review found still open, in the order it must be done.

## 1. There is no way to create a coach — RESOLVED (2026-08-26)

This item also uncovered a deeper design error: Coaches was built as an
EPISODE twist (`TWIST_CATALOG` entry, `phase:'pre-merge'`, scheduled on the
timeline) when it is actually a SEASON-LONG system — a coach spans the whole
pre-merge phase, exactly like the Mole. Scheduling it on one night meant
`ep.isCoaches` (which `promoteCoaches` reads to know the merge happened) was
only ever true on the scheduled episode; any season that did not schedule
Coaches on the exact merge episode stranded every surviving coach outside
`gs.activePlayers` for good.

Fixed by making Coaches `seasonConfig.coaches` (`disabled`|`manual`|`auto`,
plus `seasonConfig.coachesPerTribe`), wired in `initGameState` the same way as
`seasonConfig.mole`, with `ep.isCoaches` now DERIVED each episode from
`gs.coaches.length` rather than set by `applyTwist()`. See the "Correction"
section at the top of the design doc.

- **manual** — the Cast Builder's per-player Coach checkbox (already built;
  now gated on this mode instead of always reading `p.isCoach`).
- **auto** — `coachesPerTribe` coaches per tribe, selected using `isReturnee`
  as the casting proxy for "franchise winner or finalist" (see item 6 below —
  real `js/fame.js` output still isn't reachable at init).

A coach's name never appears in `tribe.members` in either mode — the
exclusion happens before tribes are built, same as it did for the old
checkbox-only path.

## 2. Manual verification never done — no longer blocked

Both were impossible until item 1 existed; item 1 is now resolved (a real
season with `seasonConfig.coaches` set produces coaches through
`initGameState`), but a browser render still hasn't been done.

- **Render the Coaches' Board in a browser.** This repository has shipped VP
  screens that were written, wired, tested and drew nothing.
- **Dump a real episode backlog and read it.** Two prose bugs on this branch
  were found exactly that way and none by a test.
- Confirm a coach boot does not render as "nobody went home". `ep.eliminated`
  is deliberately null on those nights; the fact lives on `ep.coachElimination`
  and is now persisted, but nothing has been seen on screen.

## 3. Awe's positive half is still unimplemented

Pre-flight ruling 1 split the fame mechanic in two. The negative half shipped —
the strategic archetypes read a famous coach as a résumé and target him sooner.
The positive half, *"awe reduces willingness to target that coach"*, was
deferred and never landed, so targeting is one-sided toward booting.

This matters for the balance question below: the 55% first-boot rate was
measured with only the pressure to boot wired, and none of the deference.

## 4. The balance question, for a human

Across 20 seasons, **11 of 20 first eliminations were a coach**. That clears
the plan's `< 14` ceiling and is well above the ~25% a random pick would give,
so coaches are being deliberately targeted — which is what the twist wants.

Whether a coach *should* be first out in the majority of seasons is a design
preference, not a defect. Ask it again after item 3, since the deference half
is missing from the current number.

Levers, in preference order: `sessionGain` (make training worth more),
`AWE_BIAS` for the receptive archetypes (make newbies defer more),
`sessionsFor` (reduce session scarcity), `_coachTargetDanger` in
`js/alliances.js` (reduce how threatening a coach reads).

## 5. Inert by design, awaiting item 1

The save card and the advantage law are built, tested and unreachable:
`offerSaveCard` is never offered at a tribal, and `coachCanPlay` /
`giveAdvantage` never guard a real play. Coaches are also outside
`gs.activePlayers`, so they cannot *find* an advantage — Team Switch, The Loan
and Second Opinion are not in the advantage catalog at all.

## 6. Smaller things

- Coach-vs-coach deals (non-aggression, trades, taking the fall) were scoped
  out of the plan and never built. Poaching works.
- The pre-challenge "read" and the coach-named reaction beat during a challenge
  were scoped out; the training bonus itself does reach challenge scoring.
- `js/alliances.js` `formAlliances` matches on the joined label on a
  double-tribal night, so a coach cannot be the majority's PRIMARY pick there.
  Reachable via secondary paths. Accepted limitation.
- Fame uses a two-tier `isReturnee` proxy (newbie 0, returning vet 2.0) rather
  than real career stars, because `js/fame.js` needs season data an episode
  cannot reach. Replaceable once item 1 plumbs it.

## 7. Seed the season test's RNG

`tests/coach-season.test.js` — "promotes whoever survived to the merge" — is
flaky. It uses an unseeded `Math.random()`, and a promoted coach can
legitimately be voted out in the same merge episode they join, so the
assertion sometimes finds them already gone.

That is the twist behaving correctly and the test being unable to tell. This
repo already has the rule: a bare `Math.random()` breaks replay guards, use a
stable seeded generator. Seed it and assert against a fixed season rather than
re-rolling one.
