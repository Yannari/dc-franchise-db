# Coaches Twist — what is left

The engine is built, reviewed and measured across 20 headless seasons. This is
what a final whole-branch review found still open, in the order it must be done.

## 1. There is no way to create a coach — BLOCKING

Nothing in production calls `addCoach`. `gs.coaches` is populated only by
tests, so selecting **Coaches** in the twist catalog sets `ep.isCoaches`, finds
no coaches, and does nothing at all.

This is a defect in the plan, not in the implementation: every mechanism was
specified and no way to create the thing they operate on. It was deliberately
left out of the final fix wave because *where* coaches get configured is a
design decision:

- **Cast builder** — pick coaches while assembling the season, alongside
  returnees. Fits how the roster is already chosen, and lets a coach's `stars`
  be set per person.
- **Season config** — a count per tribe, coaches drawn automatically from
  franchise winners and finalists using `js/fame.js`. Less control, but it is
  the twist's own casting rule expressed as code.

Whichever is chosen must also decide whether a coach's name appears in
`tribe.members`. `eliminateCoach` scopes its reactions to the tribe, so if a
coach is a member they will react to their own elimination.

## 2. Manual verification never done — BLOCKING

Both were impossible until item 1 exists, and neither is covered by a test.

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
