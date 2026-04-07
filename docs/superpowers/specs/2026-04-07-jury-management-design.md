# Jury Management — Endgame Targeting

**Date:** 2026-04-07
**Status:** Approved
**Type:** Heat modifier (small, targeted)

---

## Overview

Strategic players factor jury math into vote targeting post-merge. Players they'd lose to at FTC get extra heat. Players they'd beat get reduced heat (goat protection). Plugs into existing `computeHeat` — no new systems.

---

## Gate

- Post-merge only
- 8 or fewer active players
- Jury-decided finale format (not fan vote finale)
- Only strategic players (strategic >= 6) run the calculation

---

## The Jury Math

For each strategic voter at tribal, for each potential target:

1. Count jurors with `getBond(juror, target) >= 2` → target's estimated jury votes
2. Count jurors with `getBond(juror, voter) >= 2` → voter's estimated jury votes
3. `juryAdvantage = targetJuryVotes - voterJuryVotes`

**If juryAdvantage > 0** (target would beat me at FTC):
- Heat modifier: `+ juryAdvantage * 0.4` — proportional to how badly they'd beat me
- This player is an FTC threat I need gone

**If juryAdvantage < 0** (I would beat target at FTC):
- Heat modifier: `- 0.5` — mild protection, I want to sit next to them
- This player is beatable — protect them

**If juryAdvantage == 0** (toss-up):
- No modifier

---

## Integration

Single addition to `computeHeat`, in the post-merge section after existing threat modifiers.

Flows into `pickTarget` via heat → alliances naturally target FTC threats and protect goats.

---

## Visible In

- Vote reasons: "jury threat — too dangerous at FTC" / "protecting a beatable opponent"
- Voting plans: FTC threat targeting visible in alliance target reasoning
- NOT in camp events — pure vote-time calculation

---

## Scope

~15 lines in `computeHeat`. No new functions, no new state, no VP changes.
