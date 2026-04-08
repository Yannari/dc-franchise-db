# Triple Dog Dare You — Design Spec

## Overview

Post-merge schedulable twist inspired by Total Drama Island's "I Triple Dog Dare You!" episode. Replaces both the immunity challenge AND tribal council for that episode. One player is eliminated directly from the challenge — no vote. The player who completes the most dares earns a resume moment (no immunity).

- **Twist ID**: `triple-dog-dare`
- **Category**: `elimination` (replaces tribal)
- **Phase**: Post-merge only
- **Schedulable**: Yes, via twist schedule
- **Produces**: 1 elimination (no vote, sudden death)

## Challenge Flow

### Setup

All active post-merge players participate. Everyone starts with **0 freebies**. A wheel displays portraits of all eliminated players (flavor).

### Each Round

1. **Spin the wheel** → lands on a random eliminated player's portrait (narrative flavor — "Duncan dares you to...")
2. **Dare drawn** → random dare from one of 4 categories (gross-out, humiliation, pain/fear, sacrifice)
3. **Player receives the dare** → first round = random rotation, subsequent rounds = whoever was redirected to
4. **Decision**:
   - **Accept** → willingness roll based on stats + dare category. **Pass** = dare completed, earn +1 freebie. **Fail** = couldn't go through with it → **ELIMINATED**.
   - **Redirect** → spend 1 freebie, pass the dare to someone else. That person faces the same choice.
5. **If 0 freebies** → MUST accept. No choice.

### End Conditions

- **Primary**: Someone fails a willingness roll → eliminated, challenge over.
- **Fallback**: After `playerCount * 2` rounds with no elimination, the player with fewest completed dares is eliminated.

## Dare Categories

Four categories, each drawn randomly with equal probability. The dare text is cosmetic — pulled from a pool of flavor descriptions. The category determines which stats affect willingness.

### Dare Pool Examples

**Gross-out**: Lick someone's armpit. Eat mystery meat slurry. Chew someone's used gum. Drink swamp water. Eat a live bug.

**Humiliation**: Dress up in a ridiculous costume. Do a chicken dance in front of everyone. Slap yourself in the face. Serenade the host. Declare your undying love for your worst enemy.

**Pain/Fear**: Purple nurple a sleeping bear. Swim in a pool of leeches. Sit on an anthill. Walk across hot coals. Wrestle a raccoon.

**Sacrifice**: Shave your head. Destroy your luxury item. Give up your next reward. Eat your entire tribe's rice ration. Burn your camp shoes.

## Willingness Formula

All categories use **boldness as primary stat**. A secondary stat modifier tilts the odds per category.

```
willingness = boldness * 0.08 + secondaryStat - fatigue - baseDifficulty
```

| Category      | Secondary Stat                 | Logic                                                    |
|---------------|-------------------------------|----------------------------------------------------------|
| Gross-out     | (none — pure boldness)        | Guts to be disgusted                                     |
| Humiliation   | `(10 - social) * 0.03`       | High social = more ego to bruise = harder to accept      |
| Pain/Fear     | `physical * 0.03`            | Physical players handle pain better                      |
| Sacrifice     | `(10 - loyalty) * 0.03`     | Loyal players value things more = harder to give up      |

### Fatigue Escalation

Each round adds `+0.03` to a global fatigue counter. By round 10, that's `+0.30` penalty. By round 15, `+0.45`. Prevents infinite loops — eventually even bold players crack.

### Base Difficulty

Each dare has a base difficulty of `0.40`. Combined with fatigue, this means:
- Boldness 10 (0.80) vs difficulty 0.40 = very likely to complete early rounds
- Boldness 5 (0.40) vs difficulty 0.40 = coin flip from round 1
- Boldness 3 (0.24) vs difficulty 0.40 = needs secondary stat help or they're in trouble

## Freebie Economy

### Earning
- Complete a dare = +1 freebie

### Spending
- Redirect a dare = -1 freebie (must choose a target to pass it to)

### Sharing — One Universal Formula

Whether allied, in a temporary pact, or unaffiliated — the same decision logic applies. Alliance membership isn't a prerequisite; it just means you probably already have high bonds + shared strategic interest.

```
shareChance = bond * 0.05 + loyalty * 0.05 + strategicValue - selfPreservation
```

**Bond** (`bond * 0.05`): How much do I care about this person?

**Loyalty** (`loyalty * 0.05`): Am I the type to help others?

**Strategic value** (`strategic * 0.03`): Is keeping them alive good for MY game?
- Target is a shield (higher threat) → +bonus
- Target votes with me → +bonus
- Target is a jury threat I want gone → -penalty

**Self-preservation**: Based on current freebie count:
- 1 freebie left → almost never share (`-0.30`)
- 2 freebies → cautious (`-0.10`)
- 3+ freebies → willing to share (`0.00`)

**Archetype modifiers**:
- Hero / loyal-soldier: `+0.08` (natural helpers)
- Social-butterfly: `+0.04`
- Villain / mastermind: `+0.00` base, but strategic value weighted 2x (only share if it's strategically smart)
- Chaos agent: random modifier (`Math.random() * 0.10`)

### Sharing Trigger

Sharing is evaluated when a player's freebie count drops to 0-1. Nearby players (by bond) are checked for willingness to gift.

## Redirect Targeting

When a player redirects a dare, they choose who to pass it to:

```
targetWeight = (-bond * 0.4) + (heat * 0.3) + (allianceConsensusTarget * 0.3)
```

- **Bond**: Enemies get targeted first (negative bond = high weight)
- **Heat**: Existing tribal target momentum carries into the challenge
- **Alliance consensus**: If your alliance has identified a target, funnel dares there
- **Alliance protection**: Alliance/pact members get a strong negative weight (avoid targeting allies)

### Alliance Betrayal

Within an alliance, a player may redirect a dare TO their own ally:

```
betrayalChance = (10 - loyalty) * 0.03 + (10 - bond) * 0.02 + strategic * 0.02
```

- Low loyalty + low bond + high strategic = "this person is expendable"
- Creates camp event: "Your own alliance just sent you that dare"
- Bond consequence: `-1.0` between betrayer and target, alliance crack event

### Freebie Refusal Betrayal

An ally refuses to share freebies when asked:

```
refusalChance = (10 - loyalty) * 0.04 + (10 - bond) * 0.03 - strategic * 0.02 (if target is strategically useful)
```

- Bond consequence: `-0.5` between refuser and requester
- Camp event: "X watched Y run out of freebies and did nothing"

## Temporary Pact System

Non-allied players can form **in-challenge pacts** — a temporary deal to cooperate during this challenge only.

### Pact Formation

```
initiateChance = strategic * 0.07 + social * 0.03
```

Initiator approaches a target. Target accepts based on:
```
acceptChance = bond * 0.05 + sharedEnemyBonus * 0.04
```

- `sharedEnemyBonus`: If both have low bonds with the same person, they're natural partners
- Pact is temporary — lasts this challenge only, does NOT create a named alliance

### Pact Behavior

- Share freebies (using the universal formula, but bond effectively boosted by pact trust `+1.5`)
- Avoid redirecting to each other
- Funnel dares toward their agreed target (lowest shared bond)

### Pact Consequences

- **Success** (target eliminated): `+0.4 bond` between pact members
- **Betrayal** (pact member redirects to partner): `-0.3 bond`, trust crack event
- **Camp event**: "X and Y made a deal during the dare challenge" — feeds into social politics

## Alliance Coordination

Alliance members automatically benefit from:
- Higher bonds → more likely to share freebies (through universal formula)
- Shared consensus target → redirect dares to outsiders
- Mutual protection → avoid redirecting to each other

But nothing is guaranteed. A villain in your alliance with bond 3 and 1 freebie left will keep it. Every sharing/targeting decision runs through the same universal formula — alliance membership just means the inputs (bond, loyalty, strategic alignment) tend to be favorable.

## VP Presentation

### Screen: `rpBuildTripleDogDare(ep)`

**Round-by-round click-to-reveal** (similar to voting reveal):

**Persistent element**: Freebie counter bar at the top showing all players + current freebie count. Players with 0 freebies highlighted in red (danger zone). Updates after each round.

**Per-round card (click to reveal)**:

1. **Wheel spin** — eliminated player portrait + name ("Duncan dares you to...")
2. **Dare reveal** — category badge (color-coded: gross-out = green, humiliation = pink, pain/fear = red, sacrifice = gold) + dare text
3. **Target** — player portrait + "receives the dare" + their freebie count
4. **Decision** — one of:
   - ✅ ACCEPTED — "completed the dare" + freebie earned animation
   - 🔄 REDIRECTED — "spent a freebie, passed to [target]" + arrow to next player portrait
   - ❌ ELIMINATED — "couldn't go through with it" + dramatic elimination card
5. **Redirect chain** — if dare bounces multiple times, show the full chain before resolution

**Freebie sharing moments**: When a player gifts a freebie, show it between rounds: "[Player] slides a freebie to [Ally]" with portraits + bond context.

**Pact formation**: When a temporary pact forms, show: "[Player] pulls [Player] aside — 'Let's work together on this one'" with portraits.

**Alliance betrayal**: Highlighted in red when a player redirects to their own ally or refuses to share.

**Final card**: Elimination portrait + quote, same style as torch snuff screen. Category badge: "COULDN'T TAKE THE DARE".

### Sidebar Label

`Triple Dog Dare` — positioned where the immunity challenge + tribal screens would normally be.

## Episode History Fields

```javascript
ep.tripleDogDare = {
  rounds: [{
    roundNum: 1,
    eliminatedSpinner: 'Duncan',     // who the wheel landed on
    dareCategory: 'gross-out',       // gross-out | humiliation | pain-fear | sacrifice
    dareText: 'Lick someone\'s armpit',
    initialTarget: 'Heather',
    chain: [                          // redirect chain
      { player: 'Heather', action: 'redirect', to: 'Gwen', freebieSpent: true },
      { player: 'Gwen', action: 'accept', completed: true, freebieEarned: true }
    ]
  }],
  freebieGifts: [{ from: 'Owen', to: 'Gwen', round: 8 }],
  pacts: [{ initiator: 'Gwen', partner: 'Owen', target: 'Heather', formedRound: 7 }],
  betrayals: [{ player: 'X', target: 'Y', type: 'redirect' | 'refusal', round: N }],
  freebiesAtEnd: { 'Owen': 5, 'Gwen': 2, ... },
  eliminated: 'Heather',
  eliminatedRound: 14,
  eliminatedDare: { category: 'sacrifice', text: 'Have your head shaved' },
  mostDares: 'Owen'    // resume moment — most completed
};
```

## Camp Events

| Event Type | Badge | Bond Effect | When |
|---|---|---|---|
| `dareCompleted` | ✅ DARE COMPLETED | `+0.3` with bold-respecting players | Each completion |
| `dareRedirectAttack` | 🎯 TARGETED | `-0.2` between redirector and target | Each hostile redirect |
| `freebieGift` | 🤝 FREEBIE SHARED | `+0.4` between giver and receiver | Each gift |
| `freebieRefusal` | ❌ LEFT HANGING | `-0.5` between refuser and requester | When ally refuses to share |
| `darePact` | 🤝 DEAL STRUCK | `+0.2` between pact members | Pact formation |
| `darePactBetrayal` | 💥 PACT BROKEN | `-0.3` between betrayer and partner | Pact member betrays |
| `allianceRedirectBetrayal` | 💥 BETRAYED | `-1.0` between redirector and target | Alliance member redirects to ally |
| `dareElimination` | 💀 COULDN'T TAKE IT | — | Final elimination moment |
| `dareMVP` | ⭐ DAREDEVIL | +popularity | Most dares completed |

## Text Backlog

`_textTripleDogDare(ep, ln, sec)` — outputs all rounds, redirect chains, freebie economy, pacts, betrayals, and elimination.

## Integration Points

- **Twist catalog**: `TWIST_CATALOG` entry with `category: 'elimination'`, `phase: 'post-merge'`
- **Episode flow**: Replaces immunity challenge + tribal for this episode. No `simulateVotes()`, no `resolveVotes()`.
- **`simulateEpisode`**: After camp events, run `simulateTripleDogDare(ep)` instead of challenge+tribal
- **Advantage interaction**: Idols/advantages are NOT playable during Triple Dog Dare (no tribal council). If someone holds an idol, tough luck — this isn't a vote.
- **Tied Destinies**: If TD is active and a TD-paired player is eliminated, their partner goes too (collateral). The challenge doesn't know or care about TD — it just produces an elimination, and TD handles the rest.
- **Redemption/Rescue Island**: Eliminated player goes to RI/Rescue if active, same as any elimination.
- **`handleAdvantageInheritance`**: Called on the eliminated player before stripping advantages.
- **`patchEpisodeHistory`**: Must include `tripleDogDare` field.
- **Skipped elimination tracking**: Does NOT add to `gs.skippedEliminationEps` (an elimination happened).

## Scope Boundaries

- **NOT implementing**: Phobia Factor (pre-merge, separate twist, designed later)
- **NOT implementing**: No Pain No Game (separate twist, designed later)
- **Dare text is flavor only**: Categories matter mechanically, but specific dare text is cosmetic pulled from pools
- **No persistent effects**: Temporary pacts don't become real alliances. Freebie counts don't carry between episodes.
