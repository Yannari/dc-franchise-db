# Tied Destinies — Design Spec

**Date:** 2026-04-06
**Status:** Approved
**Type:** Schedulable twist (post-merge only)

---

## Overview

Koh-Lanta-inspired twist. Players are randomly paired at the start of the episode. If one player in a pair is voted out, their partner is eliminated too. One-episode shock twist that counts as a double elimination.

---

## Config

- Twist catalog entry: `tied-destinies`
- Schedulable via Episode Format Designer on any post-merge episode
- **Post-merge only** — if scheduled pre-merge, twist is skipped
- **Even player count required** — if odd number of active players when twist fires, twist is skipped
- Counts as double elimination in the season timeline (advances by 2 players)

---

## Episode Flow

### 1. Pairing Announcement

- Players randomly paired (no stat/bond weighting — pure random)
- Pairs announced publicly at the start of the episode
- Each player gets an emotional reaction based on bond with partner:
  - Bond >= 3: relieved/happy — "We got this"
  - Bond 0-3: cautious/neutral — "Could be worse"
  - Bond < 0: dread/anger — "You're kidding me"
  - Bond <= -5: fury/panic — "This is a death sentence"
- Dedicated VP screen: pairs revealed one by one with portraits, bond tier, emotional reaction

### 2. Pair Camp Events

Pair-specific events fire based on relationship:

**Partner tension** (bond < 0):
- Resentment, blame, "you're going to get me killed"
- Bond damage: -0.3 (the pairing makes it worse)

**Partner reluctance** (bond 0-1):
- Awkward forced cooperation, reluctant strategy talks
- Small bond boost: +0.2 (shared threat brings them slightly closer)

**Partner strategy session** (bond >= 1):
- Coordinating who to target, sharing info, planning how to survive together
- Bond boost: +0.4

**Tribe pair debate**:
- Players openly discuss which pair to target — weighing the cost of each double elimination
- 2-3 debate events per episode showing different perspectives

All events tagged with TIED DESTINIES badge.

### 3. Paired Immunity Challenge

- Each pair competes as a unit — combined stats determine pair score
- Formula: average of both players' challenge stats + pair synergy bonus (bond * 0.1)
- Winning pair BOTH get immunity
- No solo competitor — even count is enforced

### 4. Pair-Aware Voting

**Partners can't vote for each other.**

**`computeHeat` pair targeting:**
- When Tied Destinies is active, heat calculation factors in BOTH members of each pair
- "Pair threat" = combined threat of both members
- A weak player paired with a threat gets EXTRA heat — they're the affordable path to eliminating the threat
- A strong player paired with an ally gets REDUCED heat — the tribe doesn't want to lose both

**Alliance logic:**
- If an alliance member is paired with a threat, the alliance debates: protect or sacrifice?
- If an alliance member is paired with another ally, the alliance strongly avoids targeting that pair

**Vote reasoning adapts:**
- `buildVoteReason` reflects pair-aware logic
- "Voted for X because eliminating X also removes Y — double threat removal"
- "Avoided targeting X because their partner Z is a crucial ally"
- "Targeting the weaker half to take out the stronger partner"
- Defection reasoning: "broke from alliance because the pairing changed the math"

### 5. Double Elimination

**Vote target eliminated first:**
- Normal torch snuff, exit quote, placement

**Partner eliminated second:**
- Gets their own full elimination card — portrait, archetype, exit quote, placement
- Exit quotes reflect being collateral:
  - "I didn't get voted out. I got tied to the wrong person."
  - "They weren't coming for me. But here I am."
  - "I played a good game. I just got paired with the wrong person at the wrong time."
  - "That's the cruelest twist this game has ever thrown. I was safe until they drew my name next to theirs."
- VP: "TIED DESTINIES" label on the partner's torch snuff (distinct from normal elimination)

**Both players:**
- Go to jury if jury phase is active
- Check RI if Redemption/Rescue Island is active
- `handleAdvantageInheritance` called for BOTH before stripping advantages

### 6. WHY Section

**Primary target WHY:**
- Explains pair-aware targeting
- "Voting out X was a two-for-one. The tribe wanted Y gone but couldn't reach them directly — X was the path."
- "The pair of X and Y was too dangerous to leave intact. The tribe chose the weaker link."

**Partner WHY (separate section):**
- "Z wasn't the target. Z was tied to X. The tribe decided the cost of losing Z was worth removing X."
- "If the vote was about Z, they'd have voted Z directly. This was about X. Z was collateral."
- If the pair was specifically targeted to remove the partner: "The vote wasn't really about X. It was about getting Y out of the game. X was the affordable half."

---

## VP Screens

### Tied Destinies Announcement Screen
- Dedicated VP screen inserted after camp pre-challenge events
- Title: "TIED DESTINIES"
- Pairs revealed with both portraits side by side
- Bond tier between each pair displayed
- Emotional reactions for each player
- Unpaired message if twist was skipped (shouldn't happen — even count enforced)

### Challenge Screen
- Normal challenge screen but shows pairs competing as units
- Winning pair highlighted together

### Votes Screen
- Normal vote rendering with pair-aware vote reasons
- After torch snuff of vote target: "TIED DESTINIES" card showing the partner's elimination
- Partner gets full elimination card (portrait, archetype, exit quote)
- Separate WHY section for the partner

### Camp Events
- TIED DESTINIES badge on all pair-specific events
- Partner tension / reluctance / strategy events rendered normally in camp screen

---

## Text Backlog

New `_textTiedDestinies(ep, ln, sec)` formatter covering:
- Pairing announcement with reactions
- Pair camp events
- Pair challenge results
- Double elimination with both WHY sections

---

## State

```
ep.tiedDestinies = {
  pairs: [{ a: 'Name1', b: 'Name2' }],     // the pairs
  reactions: { 'Name': 'relieved' },          // emotional reactions
  immunePair: { a: 'Name1', b: 'Name2' },    // winning pair
  eliminatedTarget: 'Name',                    // vote target
  eliminatedPartner: 'Name',                   // collateral
}
```

Stored on `ep` and saved to `gs.episodeHistory` via `patchEpisodeHistory`.

---

## Engine Integration

| System | Change |
|--------|--------|
| `applyTwist` | Handle `tied-destinies` engine type: generate pairs, store on ep |
| `simulateIndividualChallenge` | Paired mode: combine pair stats, return winning pair |
| `simulateVotes` | Block partner-partner votes, pair-aware targeting |
| `computeHeat` | Factor pair threat when `ep.tiedDestinies` is active |
| `formAlliances` | Consider pair membership in targeting decisions |
| `resolveVotes` | After elimination, also eliminate partner |
| `handleAdvantageInheritance` | Call for both eliminated players |
| `patchEpisodeHistory` | Save `ep.tiedDestinies` data |
| `generateCampEventsForGroup` | Inject pair-specific events when twist is active |
| `rpBuildVotes` / `rpBuildVotes2` | Partner elimination card + partner WHY section |
| `buildVPScreens` | Insert announcement screen + pair challenge display |
| `generateSummaryText` | New `_textTiedDestinies` formatter |

---

## Scope Notes

- One-episode twist — no multi-episode state management needed
- Pairs are random — no config UI for choosing pairs
- Even player count enforced — odd count skips the twist entirely
- Compatible with RI/Rescue Island (both eliminated players check `isRIStillActive`)
- Compatible with jury phase (both go to jury)
- NOT compatible with pre-merge (twist is skipped)
- The Mole: if a Mole is in a pair, they can still sabotage normally. If a Mole's partner is voted out, the Mole is eliminated too (collateral).
