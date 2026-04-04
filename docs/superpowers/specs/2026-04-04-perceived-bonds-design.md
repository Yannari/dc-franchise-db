# Perceived Bonds — Non-Mutual Relationship System

## Overview

The current bond system is strictly symmetric — `getBond(A, B) === getBond(B, A)`. This prevents the engine from producing one-sided relationships: a player trusting someone who's plotting against them, a goat thinking they have a real alliance, a villain faking warmth. These are the most dramatic moments in Survivor and the engine can't generate them.

**Solution:** A perceived bond overlay (`gs.perceivedBonds`) that tracks where specific players *believe* the bond is different from reality. The underlying symmetric bond system stays unchanged. Only decision-making systems read from the overlay; everything else operates on real bonds.

## Architecture

### Data Structure

```js
gs.perceivedBonds = {
  "Alice→Bob": {
    perceived: 5,       // what Alice thinks the bond is
    reason: 'villain-manipulation',  // trigger that created this gap
    createdEp: 3,       // episode the gap formed
    correctionRate: 0.3  // how fast Alice is closing the gap (intuition-based)
  }
}
```

- **Key format:** `"A→B"` (directional, NOT sorted). Means "A thinks the bond with B is `perceived`."
- **Real bond:** Always read from `getBond(A, B)` — the overlay only stores perception.
- **One entry per direction** — A can misperceive B while B sees A correctly, or both can misperceive each other.

### Core Functions

**`getPerceivedBond(a, b)`** — Returns what player A believes the bond with B is.
```js
function getPerceivedBond(a, b) {
  const key = a + '→' + b;
  const entry = gs.perceivedBonds?.[key];
  if (entry && Math.abs(entry.perceived - getBond(a, b)) >= 0.3) {
    return entry.perceived;
  }
  return getBond(a, b);
}
```

**`addPerceivedBond(a, b, perceived, reason)`** — Creates a perception gap.
```js
function addPerceivedBond(a, b, perceived, reason) {
  if (!gs.perceivedBonds) gs.perceivedBonds = {};
  const s = pStats(a);
  const correctionRate = s.intuition * 0.07;
  gs.perceivedBonds[a + '→' + b] = { perceived, reason, createdEp: (gs.episode || 0) + 1, correctionRate };
}
```

### Where `getPerceivedBond` Replaces `getBond`

Only in systems where a player makes decisions based on their own belief:

| System | What changes |
|--------|-------------|
| `simulateVotes` — voter choosing target | Voter uses `getPerceivedBond(voter, target)` |
| `formAlliances` — accepting/rejecting recruitment | Recruit uses `getPerceivedBond(recruit, recruiter)` |
| `computeHeat` — bond-based heat from voters | Each voter's bond contribution uses their perception |
| Alliance defection checks | Player checks perceived bond with alliance members |
| `checkAllianceQuitting` | Player evaluates alliance based on perceived bonds |

Estimated ~15-20 specific call sites. The other ~485 `getBond` calls remain unchanged.

### Where `getBond` Stays Unchanged

- Bond decay/recovery
- VP viewer displays (show real bond, with perception gap indicator)
- Jury voting (jurors see truth by FTC)
- `addBond` calculations
- Camp event bond consequences
- Showmance detection

## Triggers

### Batch 1 (Core)

**Trigger A — Low-Loyalty Betrayal**
- **When:** Player B votes against Player A, AND A's `getPerceivedBond(A, B)` >= 3, AND B's loyalty <= 4
- **Effect:** A's perceived bond with B freezes at the pre-vote value. Real bond drops normally from the betrayal.
- **Correction rate:** Based on A's intuition (`intuition * 0.07`)
- **Creation event:** Silent — the point is A doesn't know.
- **Realization event:** "{name} replays the last vote in {pr.pos} head. The math doesn't add up. {betrayer}'s name keeps coming back." / "{name} finally sees what everyone else saw weeks ago. {betrayer} was never on {pr.pos} side." / "{name} catches {betrayer} avoiding eye contact. It clicks."

**Trigger B — Villain Manipulation**
- **When:** Villain archetype forms bond >= 2 with a non-villain target, AND villain's strategic >= 7, AND target's intuition <= 6
- **Effect:** Each episode the villain and target interact (alliance, camp event, bond increase), the target's perceived bond inflates by +0.3 to +0.5 beyond the real bond. The villain is faking warmth.
- **Correction rate:** Based on target's intuition. Bonus +0.2 correction if target witnesses villain betraying someone else.
- **Creation event:** "{villain} smiles at {target}. It's rehearsed. {target} doesn't notice." / "{villain} tells {target} exactly what {pr.sub} need{pr.sub==='they'?'':'s'} to hear. None of it is real." / "{villain} puts an arm around {target}. The camera catches the look on {villain}'s face when {target} turns away."
- **Realization event:** "{target} catches {villain} in a lie. A small one. But it rewrites everything." / "{target} watched {villain} do to someone else exactly what {villain} did to {pr.obj}. The pattern is clear now."

**Trigger C — Mastermind Goat-Keeping**
- **When:** Player with strategic >= 8 is in an alliance with a player whose `threatScore()` <= 3.5, AND the strategic player's real bond with the goat <= 2
- **Effect:** The goat's perceived bond with the mastermind inflates by +2 to +3 above real. The goat thinks they're in a real F2/F3 deal.
- **Correction rate:** Based on goat's intuition. Bonus +0.15 correction if another player warns them (eavesdrop/rumor event).
- **Creation event:** "{goat} tells the camera {mastermind} is taking {pr.obj} to the end. {mastermind} told {pr.obj} so." / "{goat} walks around camp like {pr.sub} already won. {mastermind} watches. Smiles. Says nothing." / "{mastermind} needs {goat} for three more votes. After that, {pr.sub} {pr.sub==='they'?'are':'is'} disposable."
- **Realization event:** "{goat} overhears a conversation {pr.sub} wasn't supposed to hear." / "{goat} asks {mastermind} about the final three. The pause before the answer says everything." / "Someone tells {goat} the truth. {pr.Sub} didn't believe it at first. Now {pr.sub} {pr.sub==='they'?'do':'does'}."

### Batch 2 (Situational)

**Trigger D — Alliance Blindspot**
- **When:** An alliance collectively decides to target one of its own members, AND the target doesn't sense it (fails the existing scramble check: `strategic * 0.05 + intuition * 0.02`)
- **Effect:** Target's perceived bonds with alliance members stay at current level. Real bonds don't change until the vote — the betrayal IS the correction.
- **Creation event:** "{name} sits with the alliance at dinner. The conversation feels the same as always. It isn't." / "{name} checks in with everyone. They all say the right things. None of them mean it." / "The plan is set. {name} is the only one who doesn't know."
- **Realization event:** "{name} counts the eye contact at dinner. Something changed." / "{name} sees it too late. The alliance moved without {pr.obj}."

**Trigger E — Post-Betrayal Denial**
- **When:** Player A is betrayed (ally voted against them or blindsided them), AND A's loyalty >= 7
- **Effect:** A's perceived bond drops slower than reality. Real bond crashes immediately (-2 to -3). Perceived bond only drops by `(10 - loyalty) * 0.3` per episode until it catches up.
- **Correction rate:** `max(0.05, intuition * 0.08 - loyalty * 0.03)` (loyalty slows correction, intuition speeds it, floored at 0.05 so gaps always eventually close)
- **Creation event:** "{name} still sits next to {betrayer} at the fire. Everyone else sees it. {pr.Sub} {pr.sub==='they'?'don\'t':'doesn\'t'}. Not yet." / "{name} makes excuses for {betrayer}. 'Maybe {betrayer} had no choice.' The tribe doesn't argue. They know."
- **Realization event:** "{name} stops sitting next to {betrayer}. No announcement. Just a gap at the fire." / "{name} doesn't forgive {betrayer}. {pr.Sub} just stop{pr.sub==='they'?'':'s'} pretending."

**Trigger F — Showmance Blindspot**
- **When:** Player is in a showmance (phase: honeymoon or ride-or-die), AND partner's loyalty <= 5 OR partner is in a separate strategic alliance targeting the showmance player
- **Effect:** The loyal partner's perceived bond stays at showmance levels (+7 to +9) while the other partner's real bond may be drifting. Love blinds.
- **Correction rate:** Very slow — `intuition * 0.05`. Corrects fast if partner votes against them (instant shatter).
- **Creation event:** "{name} thinks they're going to the end together. {partner} has been having conversations {name} doesn't know about." / "The showmance is real for {name}. For {partner}, it's a strategy."
- **Realization event:** "{name} finds out about the other alliance. The look on {pr.pos} face says everything." / "{name} and {partner} sit apart for the first time. The tribe notices before either of them does."

**Trigger G — Provider Entitlement**
- **When:** Player is a camp provider (fishing/foraging in survival mechanics), AND tribe members' real bonds with provider are declining (average bond dropped >= 0.5 over last 2 episodes)
- **Effect:** Provider's perceived bond with tribe stays inflated — they think providing food earns loyalty. Inflation: +1.0 to +1.5 above real.
- **Correction rate:** Based on intuition. Bonus +0.3 correction when provider receives votes at tribal.
- **Creation event:** "{name} caught three fish today. {pr.Sub} think{pr.sub==='they'?'s':''} that buys {pr.obj} another week. It doesn't." / "{name} works harder than anyone at camp. {pr.Sub} think{pr.sub==='they'?'s':''} that matters more than it does."
- **Realization event:** "{name} got votes. After everything {pr.sub} did for the tribe. The betrayal isn't strategic — it's personal." / "{name} stopped fishing. Not because {pr.sub} can't. Because {pr.sub} finally realized it wasn't earning {pr.obj} anything."

**Trigger H — Swap Loyalty Assumption**
- **When:** Player is swapped to a new tribe (tribe swap, first impressions, abduction, mutiny), AND new tribe members' bonds >= +1.0 (from sympathy/fresh start)
- **Effect:** Swapped player's perceived bond with new tribe inflates by +1.0 to +1.5 beyond real. They mistake politeness for genuine loyalty.
- **Correction rate:** Normal intuition-based. Corrects naturally as bonds stabilize over 2-3 episodes.
- **Creation event:** "{name} thinks {pr.sub} {pr.sub==='they'?'have':'has'} found a new home. The tribe is being kind. Kind isn't the same as loyal." / "The new tribe welcomed {name}. Smiles. Shelter space. A seat at the fire. It felt real. The question is whether it stays that way."
- **Realization event:** "{name} realizes the new tribe was never {pr.pos} tribe. Just a waiting room." / "{name} hears {pr.pos} name come up. Not as a target — just as an option. That's worse."

## Correction System — `updatePerceivedBonds(ep)`

Called once per episode in `simulateEpisode`, after `generateCampEvents` and before the challenge/tribal flow.

### Flow

1. Loop through all entries in `gs.perceivedBonds`
2. Update `real` reference to current `getBond(a, b)`
3. Apply correction: `perceived += (real - perceived) * correctionRate`
4. Apply situational modifiers to correction rate this episode
5. If `|perceived - real| < 0.3`: delete entry, fire realization camp event
6. If gap was large (>= 2.0 when closed): apply -0.5 bonus bond hit + emotional state shift

### Correction Rate

Base: `intuition * 0.07`
- Intuition 10: 0.70 — mostly corrected in 1 episode
- Intuition 7: 0.49 — closes in ~2 episodes
- Intuition 5: 0.35 — closes in ~3 episodes
- Intuition 3: 0.21 — lingers 4-5 episodes

### Situational Modifiers (additive, applied per episode)

| Modifier | Rate Change |
|----------|-------------|
| Received votes at tribal | +0.30 |
| Witnessed deceiver betray someone else | +0.20 |
| Eavesdrop camp event involving deceiver | +0.15 |
| Emotional state: paranoid | +0.10 |
| High loyalty (Trigger E only) | -loyalty * 0.03 |

### Realization Consequences

When a perception gap closes (entry deleted):
- If the gap was >= 2.0: additional -0.5 bond hit (the pain of being wrong)
- If the gap was >= 3.0: emotional state shifts to `paranoid`
- If the gap was >= 4.0: emotional state shifts to `desperate`

## VP Viewer — Relationship Display

### Normal (no gap)
```
Bowie & Scott — feel a mutual solid bond toward one another.
[SOLID BOND]
```

### With perception gap
```
Bowie & Scott — Bowie feels a solid bond. Scott feels neutral.
[ONE-SIDED]
```

Uses existing `REL_TYPES` tier labels for each player's perspective. The `ONE-SIDED` badge uses amber color to signal something is off without implying danger.

### Camp Event Badges

- Creation events: `ONE-SIDED` badge with class `gold`
- Realization events: `WAKE-UP CALL` badge with class `red`

## Serialization & State Management

- `gs.perceivedBonds` is a plain object — survives JSON.stringify/parse without special handling
- Initialized in `initGameState()` as `perceivedBonds: {}`
- Captured in `ep.gsSnapshot` automatically
- On player elimination: all entries with that player (both directions) are deleted

## Implementation Order

- **Batch 1:** Core functions (`getPerceivedBond`, `addPerceivedBond`, `updatePerceivedBonds`), triggers A/B/C, VP display, correction system
- **Batch 2:** Triggers D/E/F/G/H
