# Carry-forward into Plan 5 (scene selection, thread continuity, windows)

Findings raised during Plan 4 and deliberately NOT fixed there, because they share one
root cause and fixing them on top of the current selector would be building on sand.

## The root cause

`js/tr/events.js:360` `_sceneActors()` draws actors uniformly from the living cast:
solo ~40% of the time, otherwise a random pair. Nothing ever convenes a scene BECAUSE a
story is live. With ~18 alive and a 60% pair draw, the chance of redrawing one specific
pair is 0.6 * 2/(18*17) ~= 0.4% per draw.

Measured consequence: threads average 1.13 beats, 89.4% die at their first beat, 0.7%
ever reach a payoff. The continuation guard itself is correct and measurable -- given
actors who DO have a live thread, continuation runs at 0.2606 vs 0.1989 with the guard
off, monotone across OFF/HALF/SHIPPED/DOUBLE. It is simply almost never asked.

## Carried findings

1. Scene selection must bias toward actors with open threads. This is the fix; everything
   below is downstream of it.
2. `js/tr/threads.js:128` `residue` is write-only -- zero production readers. Spec 5.4.4's
   payoff is unbuilt.
3. Two of the four anti-repetition guards are dead in shipped content: `acts:` used by
   2/81 events, `oncePerSeason` by 0/81, `ev.cooldown` by 0/81.
4. Empty windows: `journey-out` 0 events, `journey-back` 0, `night` 1 (and the audit probe
   reads max=0 for it, having no showmance). Populating them was projected at +50%
   firings, +53% distinctness.
5. `trust-trade-reads` takes ~0.40-0.455 of all trust-family firings -- two in five of its
   own family. Real repetition problem, predates Plan 4.
6. `trust-protect-pact` fires once in 67 seasons, below the one-in-forty floor. Raising it
   moves the firing-share distribution that the dominance band and the twelve calibration
   bands are measured against, so it needs a round that re-measures them.
7. Spec gaps: no event reads emotional state (5.3) or a thread's `.outcome` (5.5); thread
   lacks `act` (5.2).

## Repo hazard worth fixing separately

`vitest.config.js` excludes `**/*-audit.test.js` from `npm test`. Three separate times in
this project a guard has been placed in a file matching that pattern and therefore run in
no job (Task 4 caught and renamed one; Task 5/6 reintroduced it; fix round 1 re-banded
family dominance inside it). Worth a CI check that fails when a `tests/*-audit.test.js`
file contains an assertion no job runs.

## Method that kept working

Build a version with content removed but shape preserved, and check the metric does not
improve just as much. This collapsed three flattering numbers (the placebo engine, the
channel-audit control, the three-arm counterfactual) and rejected one metric outright
(advance-share, which read 11.6% live vs 11.0% with the guard disabled).

And: write guards as a RULE over the whole pool, never as a list of known-bad cases. The
list-shaped version of the ground-truth probe would have fixed 3 leaks and left 3; the
rule-shaped one found all 6, and later found 9 more untested fork branches.
