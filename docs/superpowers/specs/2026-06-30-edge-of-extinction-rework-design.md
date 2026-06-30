# Edge of Extinction Rework — Design Spec

**Date:** 2026-06-30
**Status:** Draft for review
**Scope:** Reworks the `riFormat: 'rescue'` (Edge of Extinction) path only. The `'redemption'` (duel) format is untouched.

## 1. Goal

Turn the Edge of Extinction from a passive holding pen into a survival sub-game with real strategy, then settle re-entry with a real multi-phase challenge (modeled on `aftermayhem.js`) instead of a single weighted-random stat pick.

Two ideas drive it:
1. **Two well-being meters** (Physical, Mental) that the player must balance every episode through three actions (Train / Rest / Socialize).
2. **A multi-phase return challenge** that uses every ability, eliminates players phase by phase (each with a farewell), and re-enters the last one standing.

The reward for managing the Edge well is **banked training bonuses + healthy meters** going into the return challenge. The punishment for mismanaging it is **injury, mental breakdown, or a quit** before you ever get the chance to fight back in.

## 2. What already exists (build on, don't replace)

- `gs.riMentalState[name]` — discrete states (`focused`/`obsessed`/`broken`). **Will be derived from the new numeric Mental meter** for narrative/back-compat; the meter becomes the source of truth.
- `gs.riTraining[name][statKey]` — persistent per-stat training bonuses, already added into re-entry scoring. **Kept as-is.** Helpers `_getTrainingBonus` / `_addTrainingBonus`.
- Training events + `training-injury` events (~60%/episode). **Folded into the new action model.**
- `generateRescueIslandLife(...)` — the Edge life-event loop. **Extended** with meters + the action model.
- The rescue re-entry branch in `episode.js` (currently an inline `RI_DUEL_CHALLENGES` `wRandom` pick). **Redirected** to a new `simulateRescueReturnChallenge()`.
- `ep.riQuit` / `quit` event — the Edge-life quit + last message. **Kept**, now driven by the Mental meter.

## 3. Data model

New `gs` state (plain numbers/objects — JSON-safe, no Sets):

```js
gs.riWellbeing = {
  [name]: { pw: 100, mh: 85 }   // pw = physical well-being, mh = mental health, both 0–100
};
gs.riTraining   = { [name]: { [stat]: number } };   // existing — banked bonuses
gs.riActionLog  = { [name]: [ 'train'|'rest'|'social', ... ] };  // per-episode action history (for VP/text)
```

- **Init** when a player arrives on the Edge (in `simulateRIChoice` / RI arrival): `pw: 100`, `mh: 85` (they arrive rattled from being voted out, not fresh).
- **Cleanup** on re-entry or final elimination: delete `gs.riWellbeing[name]`, `gs.riActionLog[name]` alongside the existing `riTraining`/`riMentalState`/`riWinStreak` deletes.

### Derived mental state (for narrative + existing re-entry `mentalBonus`)
| `mh` range | state | label |
|---|---|---|
| 70–100 | `focused` | steady |
| 45–69 | `strained` | wearing |
| 25–44 | `fraying` | cracking |
| 0–24 | `broken` | at the edge |

`obsessed` is set when a player has trained ≥3 episodes in a row (existing flavor; gives the existing +0.5 re-entry bonus but accelerates `mh` decay — see §4).

## 4. Meter mechanics (per episode, per Edge resident)

Resolution order each episode:
1. **Passive time toll** (the clock): `mh -= timeToll`, where `timeToll = 3 + min(4, daysOn * 0.5)`. Longer stranded = faster mental erosion. Resilience softens it: `timeToll *= (1 - (boldness - 5) * 0.05)` (bold = more resilient, clamp 0.6–1.4).
2. **Pick one action** via the Blend logic (§5).
3. **Apply action effects** (below).
4. **Clamp** both meters to 0–100; refresh derived state.
5. **Breakdown / quit check** (§6).

### Action effects
| Action | Physical (`pw`) | Mental (`mh`) | Bonus |
|---|---|---|---|
| **Train — success** | **−8** (the grind always costs) | −1 | `_addTrainingBonus(stat, +0.4)` for that drill's stat; small `+endurance` drift |
| **Train — accident** | **−25** + wound flag | **−4** (demoralizing) | none — session wasted |
| **Rest** | **+18** | +3 | none |
| **Socialize / distract** | +2 | **+14** | none (but may fire a bond/social event — see §8) |

- **Accident chance on Train:** `0.12 + (1 - pw/100) * 0.30 + max(0, boldness - 6) * 0.03`. Worn-down and reckless players get hurt far more often. (Fresh + cautious ≈ 12%; depleted + bold ≈ 40%.)
- **Training stat** is chosen by the drill type (existing `trainingTypes` table), capped so a single resident can't bank more than **+3.0 total** across all stats (prevents a long-haul resident from becoming unbeatable).

### Hard constraints (survival gates — these gate *action availability*, not stat→outcome math, so they don't violate the proportional-stats rule)
- `pw < 25` → **cannot Train** (body too broken). Forced to Rest or Socialize.
- `mh < 25` → **must Socialize** this episode (mind takes priority), unless `pw < 25` too, in which case Rest (collapse).

## 5. Decision logic — Blend

Each episode, for each resident: apply hard constraints first; if none bind, pick Train/Rest/Socialize by weighted random (`wRandom`) using personality × stats × current meters.

```
if (mh < 25 && pw >= 25) action = 'social';        // breakdown imminent — protect the mind
else if (pw < 25)        action = 'rest';           // body wrecked — recover
else {
  trainW  = 1.0 * archTrain[arch]  * (1 + (endurance-5)*0.08 + (boldness-5)*0.06) * (pw/100);
  restW   = 0.8 * (1 + (100-pw)/100 * 1.5);
  socialW = 1.0 * archSocial[arch] * (1 + (social-5)*0.08) * (1 + (100-mh)/100 * 1.2);
  action  = wRandom(['train','rest','social'], byWeight);
}
```

Archetype multipliers (flavor):
- `archTrain`: challenge-beast 1.8, hothead 1.4, villain/schemer/mastermind 1.2, wildcard 1.1, default 1.0, social-butterfly/showmancer 0.7, goat 0.6.
- `archSocial`: social-butterfly/showmancer 1.6, hero 1.4, loyal-soldier 1.2, default 1.0, villain/schemer 0.8, challenge-beast 0.7.

Net behavior: beasts grind (and get hurt), social players chat (and stay sane but weak), bold players over-train into injury, fragile players are forced into rest/social and arrive with no bonuses.

## 6. Breakdown & quit (Edge life)

Replaces the standalone quit formula with a meter-driven one. Only rolls when `mh < 30`:

```
quitChance = 0.08 + (30 - mh)/30 * 0.32           // mh 30 → 8%, mh 0 → 40%
           * (1 + (5 - boldness) * 0.06)            // timid players break easier
quitChance += pw < 25 ? 0.05 : 0                    // a broken body adds despair
```

On a successful quit roll: existing `ep.riQuit` flow fires + a **farewell message** (archetype/emotion-flavored, pre-rendered string). `gs.popularity[name] += sympathy` (a quit reads as sad, not heroic). Meters/training cleaned up.

## 7. The Return Challenge — `simulateRescueReturnChallenge(riPlayers, ep)`

Replaces the inline `RI_DUEL_CHALLENGES` pick in the `riFormat === 'rescue'` branch of `episode.js`. Modeled structurally on `aftermayhem.js`.

### Structure
A **5-phase gauntlet**, one ability per phase, progressive elimination, last standing re-enters:

| Phase | Theme | Primary stat | Meter modifier |
|---|---|---|---|
| 1. The Climb | scale the cliff wall | **physical** | `pw` (depleted body underperforms) |
| 2. The Vigil | hold position / hang on | **endurance** | `pw` |
| 3. The Cipher | decode the totem | **mental** | `mh` (frayed mind underperforms) |
| 4. The Reckoning | win the watchers' favor | **social** | `mh` |
| 5. The Leap | final nerve over the chasm | **boldness** | `mh` |

### Per-phase scoring (proportional)
```
score = stat
      + _getTrainingBonus(name, stat)              // banked Edge work pays off
      + meterMod                                    // (meter/100 - 0.5) * 2.0  → ±1.0
      + _noise(3.0)                                 // upsets happen
```

### Elimination per phase
- Pool > 6: eliminate **bottom 2** in phases 1–2, then **bottom 1** thereafter.
- Pool ≤ 6: eliminate **bottom 1** each phase.
- Continue until **1 remains** = the re-entrant. (If a phase would cut the pool to 0, it instead resolves the winner from the current pool.)
- **Give-up override:** any competitor entering the challenge with `mh < 20` has a high chance (`0.5`) of *giving up* in phase 1–2 regardless of score — an emotional collapse rather than a loss. Distinct farewell tone.

### Farewells (last message before going home)
Every eliminated/quitting competitor gets one pre-rendered **farewell line**, selected by `{archetype, emotion, daysOnEdge, gaveUp?}`. 4+ variants per bucket. Stored on `ep.rescueReturn.eliminations[]` for VP + text. Examples of buckets: bitter villain, gracious hero, exhausted grinder, broken quitter, proud underdog.

### Output (on `ep`)
```js
ep.rescueReturn = {
  phases: [ { name, stat, scores: {name: number}, eliminated: [names], events: [strings] } ],
  eliminations: [ { name, phase, gaveUp, daysOnEdge, farewell } ],
  winner, finalStandings: [names best→worst]
};
ep.riReentrant = winner;  // existing re-entry hookup unchanged downstream
```

### Popularity
- Winning the return challenge: `+respect`. Grinding through despite low meters: `+respect`. Giving up: `+sympathy`. Reckless players who injured allies' morale: `−`. Per the "every heroic/cowardly moment touches popularity" rule.

## 8. Edge-life events & text

The existing life-event pool (struggling, bonding, fishing, shelter, comfort, duel-prep) stays. Added/changed:
- **Action events**: each resident's chosen action emits a flavored, pre-rendered event line (train/accident/rest/socialize), with the meter deltas reflected in text ("X drills until X's hands bleed — stronger, but spent").
- **Socialize** can fire an existing bonding/comfort event (bond delta) — social interaction has a gameplay consequence, per rules.
- A compact **meter readout** ("X: body 60, mind 30 — fraying") is available for the VP sidebar.

## 9. VP + text backlog (non-negotiable per project rules)

- **Return challenge VP** (new `rpBuild*` screens, themed for the bleak Edge arena): title card → one reveal screen per phase (scores, the cut, farewell cards) → winner re-entry reveal. Live sidebar = standings + each competitor's meters/bonuses, gated by reveal state, rebuilt on every reveal click (`_reapplyVisibility` pattern). DOM-only updates, sticky controls, auto-scroll — per the overdrive baseline.
- **Text backlog**: full retranscription of the return-challenge narration (every phase, every elimination + farewell, the winner), placed in `generateSummaryText()` before the camp-post section. Edge-life action events already render through the existing RI life text.

## 10. Integration points

1. **`rescue-island.js`** — meter helpers + init/cleanup; extend `generateRescueIslandLife` with the action model + meter resolution; meter-driven quit; new `simulateRescueReturnChallenge`; export it + the VP builders.
2. **`episode.js`** — rescue re-entry branch calls `simulateRescueReturnChallenge(gs.riPlayers, ep)` instead of the inline pick; set `ep.riReentrant` from its winner. Add `rescueReturn` to all `gs.episodeHistory.push` payloads (per the VP-replay rule).
3. **`vp-screens.js`** — import + register the return-challenge screens when `ep.rescueReturn` exists.
4. **`text-backlog.js`** — render the return-challenge text.
5. **`main.js`** — expose any new functions on window if referenced by onclick (VP reveal handlers).
6. **`core.js`** — meter constants (rates, caps) as named consts for tunability.

## 11. Serialization

- `riWellbeing`, `riTraining`, `riActionLog` are plain objects of numbers/strings/arrays → survive `JSON.stringify`. No functions, no Sets, so no `prepGsForSave`/`repairGsSets` changes needed.
- All event/farewell/narration text is **pre-rendered to strings** at generation time (functions don't survive save).

## 12. Edge cases

- **1 resident** at a return point: no challenge — auto re-entry with a short solo narration (still gets a meter-flavored line).
- **2 residents**: collapse to a 3-phase mini-gauntlet (physical/mental/boldness).
- **Two return points** (`riReturnPoints: 2`): the challenge runs at both `riReentryAt` and `riSecondReturnAt`; meters/bonuses persist for residents who lose the first and stay.
- **Pre-merge vs post-merge**: re-entry only fires per existing `isReentry` gating; the challenge itself is phase-agnostic.
- **Interplay with the schoolyard exile**: the Ep-1 exile is not an Edge resident (no meters) — unaffected.

## 13. Balance targets

- A **well-managed** resident (cycles train/rest/socialize) arrives with ~+1.5–2.5 across 2–3 stats and meters ≥ 50 → genuinely competitive.
- A **reckless grinder**: big bonuses (+3 cap) but `pw`/`mh` low → dominates physical/endurance phases, risks giving up in the mental/social/boldness phases or breaking down before the challenge.
- A **passive socializer**: meters high, no bonuses → survives mentally but gets cut early.
- Target: re-entry feels *earned by how you spent your time on the Edge*, not random — but `_noise(3.0)` keeps ~20–30% upset potential.

## 14. Non-goals

- No change to the `'redemption'` duel format.
- No new advantages or idols on the Edge (training bonuses are the only banked reward).
- No player-facing controls (spectator sim — all auto-driven).
