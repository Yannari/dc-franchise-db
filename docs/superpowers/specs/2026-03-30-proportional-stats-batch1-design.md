# Proportional Stats Overhaul — Batch 1: Strategic, Social, Intuition

**Date:** 2026-03-30
**Status:** Approved
**Scope:** Convert all threshold-based stat checks (>= 6, >= 7, >= 8) to proportional scaling for Strategic, Social, and Intuition stats. Every stat point should matter.

## Principle

`stat * factor` replaces `if (stat >= X)`. No floors — stat 1 contributes minimally, stat 10 contributes maximally. The math IS the floor.

Example: Instead of `if (strategic >= 7) resist = -0.15`, use `resist = -(strategic * 0.03)` → stat 5 = -0.15, stat 8 = -0.24, stat 10 = -0.30.

---

## Strategic

| Location | Current | Proportional Formula |
|---|---|---|
| Alliance initiation eligibility | `strategic >= 6` | `strategic * 0.08` chance (5=40%, 8=64%, 10=80%) |
| Alliance bond floor override | `>=7: -0.5, >=8: -1.0` | `0.5 - strategic * 0.15` (5=-0.25, 8=-0.70, 10=-1.0) |
| Coalition cap (overcommitted) | `>=7: 4, >=8: 5` | `2 + floor(strategic * 0.3)` (3=2, 5=3, 7=4, 10=5) |
| Cascade flip resistance | `>=6:-0.08, >=7:-0.15, >=8:-0.25` | `-(strategic * 0.03)` (5=-0.15, 8=-0.24, 10=-0.30) |
| Info control (confession penalty) | `>=7: -0.05` | `-(strategic * 0.007)` (5=-0.035, 10=-0.07) |
| Confidant trust scoring | `>=7: loyalty * 0.3` | `strategic * 0.04 * loyalty` (5=loy*0.20, 10=loy*0.40) |
| Late-game restlessness | `>=7 && no big moves: -0.10` | `strategic * 0.015` penalty (5=-0.075, 10=-0.15) |
| Self-preservation sense | `>=6` to trigger | `strategic * 0.05` chance bonus (4=0.20, 8=0.40) |

## Social

| Location | Current | Proportional Formula |
|---|---|---|
| Alliance initiation eligibility | `social >= 7` | `social * 0.08` chance — same formula as strategic |
| Recruit charm bonus | `>=7: social * 0.05` | `social * 0.05` always (3=0.15, 7=0.35, 10=0.50) |
| Tribe cohesion butterfly bonus | `>=8: +0.05` | `social * 0.01` (4=+0.04, 8=+0.08, 10=+0.10) |
| Tribe cohesion scaling | `(max(sA,sB)-5) * 0.04` | `max(sA,sB) * 0.02` (4=0.08, 8=0.16, 10=0.20) |
| Social intel eligibility | `social >= 7` | `social * 0.03` chance (4=12%, 7=21%, 10=30%) |
| Social intel idol discovery | `>=7: 0.35 + s*0.03` | `social * 0.05` (4=20%, 7=35%, 10=50%) |
| Bond recovery social bonus | `(avg-5) * 0.02` | `avg * 0.015` (4=0.06, 8=0.12) |
| Bond events per episode | Not scaled | `social * 0.01` weight bonus per social player on tribe |
| Comfort/support event selection | Random | Weighted by `social * 0.4` |

## Intuition

| Location | Current | Proportional Formula |
|---|---|---|
| Idol/advantage finding | `intuition * 0.001` / `0.0008` | Already proportional — keep |
| Preemptive strike eligibility | `intuition >= 7` | `intuition * 0.025` chance bonus (4=10%, 7=17.5%, 10=25%) |
| Preemptive strike fire chance | `0.18 + (intuition-7)*0.07` | `intuition * 0.03` (4=12%, 7=21%, 10=30%) |
| Self-preservation eavesdrop | `intuition * 0.015` | Already proportional — keep |
| Tip-off ally eligibility | `intuition >= 7` | `intuition * 0.08` (4=32%, 7=56%, 10=80%) |
| Tip-off bonus scaling | `getBond * 0.03` | `getBond * intuition * 0.005` |
| KiP target intuition bonus | `>=7: +3` | `intuition * 0.4` (4=1.6, 7=2.8, 10=4.0) |
| Eavesdrop event boost | `intuition * 0.015` | Already proportional — keep |
| Amulet snooping | `intuition >= 7` | `intuition * 0.04` (4=16%, 7=28%, 10=40%) |

---

## Implementation Notes

- Search for each threshold pattern and replace with the formula
- Test after each stat conversion — don't batch all three at once
- Some locations have multiple threshold tiers (>=6, >=7, >=8) that collapse into one `stat * factor`
- Verify the math produces similar results at the OLD threshold values (stat 7 with new formula should roughly equal the old >=7 effect)
