# Love Triangles Design Spec

**Date:** 2026-04-07
**Status:** Approved
**Extends:** Showmance system (`gs.showmances`)

## Problem

The showmance system only handles pairs. Total Drama is famous for triangles (Duncan/Courtney/Gwen) where A loves B, B is drawn to C, and A becomes jealous of C. The current `jealousPlayer` field on showmances is a shallow placeholder — it sets one field and fires one event type, but doesn't create a real dramatic arc.

## Solution

New `gs.loveTriangles[]` array with its own lifecycle that references existing showmances. Triangles form through two paths, escalate over 4-5 episodes with bond/heat consequences, and resolve through either a forced ultimatum or organic gameplay. Triangle drama feeds into all 4 Aftermath show segments.

---

## Data Structure

```javascript
gs.loveTriangles = [{
  center: 'B',              // player drawn to both
  suitors: ['A', 'C'],      // A = established partner, C = new attraction
  formedEp: 5,              // episode triangle detected
  phase: 'tension',         // tension → escalation → ultimatum → resolved
  episodesActive: 0,        // counter for phase transitions
  sourceType: 'dual-showmance' | 'one-sided',  // how it formed
  showmanceRef: ['B', 'A'],  // players array of the primary showmance (used to find it in gs.showmances)
  jealousyLevel: 0,         // 0-10, accumulates per episode
  resolved: false,
  resolution: null           // see Resolution Types below
}]
```

### Resolution Types

```javascript
resolution: { type: 'chose', chosen: 'A', rejected: 'C', ep: 9 }
resolution: { type: 'organic', survivingBond: 'A', ep: 8 }
resolution: { type: 'eliminated', who: 'C', ep: 7 }
```

---

## Formation

Detection runs after `updateShowmancePhases()` each episode. Max 1 active triangle at a time.

### Path 1: Dual Showmance

Player B appears in two active showmances. Center is B, suitors are the two partners. Automatic detection — no probability roll needed.

### Path 2: One-Sided Crush

Player C has bond >= 4 with B + `romanticCompat(B, C)` + B is in an active showmance with A.

Probability per episode: `Math.min(0.30, bond * 0.06)`

### Formation Constraints

- Max 1 active triangle at a time
- 2-episode cooldown after resolution before new detection rolls
- Ride-or-die showmance: formation chance drops to 0.15x (bond too locked)

---

## Lifecycle Phases

### Phase 1 — Tension (episodes 1-2)

- Jealousy events fire for suitor A noticing center B's connection with C
- `jealousyLevel += 1.0-2.0` per episode (proportional to center's bond with rival suitor)
- Bond erosion: A-C loses -0.3/ep, A-B loses -0.15/ep (suspicion building)
- Camp events: lingering glances, awkward silences, third-wheel moments
- 30% chance per episode: A confronts B privately (bond consequence based on B's response)

### Phase 2 — Escalation (episodes 3-4)

- Jealousy spills into alliances — A tries to recruit votes against C (or vice versa)
- `jealousyLevel += 1.5-2.5` per episode
- Bond erosion accelerates: A-C drops -0.5/ep, A-B drops -0.3/ep
- Split vote pressure: players aligned with A won't vote with players aligned with C
- Camp events: public arguments, "pick a side" pressure from tribemates, confessionals
- 40% chance: tribemates discuss using the triangle to their advantage (heat modifier for all 3)

### Phase 3 — Ultimatum (episode 5+)

Forced choice event fires. Center B picks based on:

| Factor | Weight |
|--------|--------|
| Bond comparison (B→A vs B→C) | 40% |
| Loyalty stat × existing relationship length | 30% |
| Strategic value (threat score, alliance overlap) | 20% |
| Random variance | 10% |

### Resolution — Rejection Severity (personality-driven)

The rejected player's reaction depends on their stats:

- **High loyalty + low strategic:** Bond crashes hard (-3 to -5), +2.0 heat targeting couple
- **High strategic + low loyalty:** Bond drops moderately (-1 to -2), pivots to new alliances
- **Villain/schemer:** May weaponize rejection for sympathy (-0.5 heat for themselves)
- **Base formula:** `rejectionSeverity = loyalty * 0.3 + temperament * -0.2 + bond * 0.2`

Chosen partner gets +1.0 bond boost with center.

### Early Resolution

- Any of the 3 eliminated → resolves as `type: 'eliminated'`
- Bond between B and one suitor drops below 1.0 organically → resolves as `type: 'organic'`

---

## Heat Integration

All 3 triangle members get heat modifier in `computeHeat()`:

- Center: `+0.4 * (jealousyLevel / 10)` — grows as triangle gets messier
- Suitors: `+0.2 * (jealousyLevel / 10)` — collateral drama heat
- Post-merge: full heat. Pre-merge: 0.3x multiplier (same as showmance pattern)

## Vote Integration

In `simulateVotes()`: rejected player gets targeting bias toward couple, proportional to rejection severity. Not a threshold — uses `rejectionSeverity * 0.1` as vote weight modifier.

---

## Camp Events

| Type | Badge | Color | Phase | Consequence |
|------|-------|-------|-------|-------------|
| `triangleTension` | ⚠ Love Triangle | gold | tension | A-C bond -0.3, jealousyLevel +1.5 |
| `triangleConfrontation` | 💔 Confrontation | red | tension/escalation | A-B bond -0.5, confessional |
| `triangleEscalation` | 🎯 Pick a Side | gold | escalation | tribemate bond shifts, heat +0.5 all 3 |
| `trianglePublicFight` | 💥 Triangle Meltdown | red | escalation | A-C bond -1.0, all 3 heat +0.8 |
| `triangleUltimatum` | 💔 Choose One | red | ultimatum | resolution fires, bond crash/boost |
| `triangleResolved` | 💕 Chose [name] / 💔 Rejected | green/red | resolved | final bond adjustments |

All events inject into `ep.campEvents[campKey].post` with `players` array for portraits. 8+ text variants per type.

Badge registration required in `rpBuildCampTribe()` `badgeText`/`badgeClass` ternary chains.

---

## Aftermath Integration

### Truth or Anvil — new contradiction type `'love-triangle'`

- **Triggers:** Interviewee was part of a triangle (any role)
- **Drama:** 7 (8 if ultimatum, 6 if organic)
- **Setup by role:**
  - Center: "You had two people fighting for you. Did you ever actually care about both, or were you stringing one along?"
  - Rejected: "You watched the person you trusted choose someone else. Were you blindsided, or did you see it coming?"
  - Chosen: "You won. But did you ever worry you were the backup plan?"
- **Evidence:** Bond history and resolution data
- **`toldTruth` check:** Existing formula (`loyalty * 0.08 + temperament * 0.03`)
- **Bond consequences:** truth = -0.3, anvil = -1.0

### Fan Call — new question category `'triangle'`

3-4 templates, tone-filtered:

- **Superfan:** "The love triangle was THE storyline this season. When did you first realize you were in the middle of it?"
- **Drama fan:** "Be honest — did you enjoy having two people competing for your attention?"
- **Hater:** "You ruined a perfectly good showmance. Was it worth it?"
- **Supporter (to rejected):** "The audience was rooting for you. How are you holding up?"

Answers branch on stats (strategic = game-aware answer, social = emotional answer).

### Unseen Footage — new type `'love-triangle'`

- **Drama:** 7
- **Description templates:** "What the cameras caught between the fire and the shelter... [center] pulled aside by [suitorA], then found talking with [suitorC] an hour later"
- **Jealousy confrontation footage:** drama 6, if escalation phase reached

### Host Roast — new templates

- **Center:** "managed to have TWO showmances. Most people can't maintain one alliance, and {name} is out here collecting partners"
- **Rejected:** "got chosen last in the love triangle. At least in Schoolyard Pick you get sent to Exile — here you just have to watch"
- **Chosen:** "won the love triangle. Congratulations. Now the entire tribe wants you both gone"

---

## Jury

No special jury modifier. Bond crash from rejection naturally flows into jury scoring through the existing bond → jury score pipeline. Avoids double-dipping.

---

## VP Viewer

- No dedicated `rpBuild` screen — triangle events render through existing `rpBuildCampTribe()` badge system
- Triangle state visible in Relationships screen through existing bond display
- Perception gaps from jealousy show ONE-SIDED badges naturally
- Unseen Footage screen handles new footage types via existing drama sort

---

## Serialization & Edge Cases

### Serialization

- `gs.loveTriangles` is plain array of objects — no Sets, survives `JSON.stringify`
- `patchEpisodeHistory(ep)` copies `ep.triangleEvents` and `ep.triangleResolution` if present

### Edge Cases

- **Triangle member eliminated:** Resolves as `type: 'eliminated'`, remaining pair continues as normal showmance
- **Both suitors eliminated same episode (double tribal):** Resolves, center gets `triangleLonely` camp event next episode (narrative only)
- **Center player eliminated:** Resolves, two suitors' mutual bond based on existing relationship — no forced reconciliation
- **Triangle + Mole overlap:** Triangle drama provides cover for sabotage (-0.15 suspicion modifier while active). Mole can sabotage triangle bonds as a sabotage type
- **Triangle + existing `jealousPlayer`:** Triangle takes priority, clears `sh.jealousPlayer` to avoid duplicate jealousy events
- **Pre-merge triangle:** Possible but unlikely (requires same tribe). 0.3x heat multiplier. Tribe swap splits triangle → `jealousyLevel` freezes, resumes at merge
- **Ride-or-die showmance:** Formation chance 0.15x (bond too locked)
- **Max 1 triangle:** Second can't form while one exists. 2-episode cooldown after resolution
