# Advantage Lifecycle: Team Swap, Vote Block, Vote Steal

**Date:** 2026-04-02
**Scope:** Add full social/narrative lifecycle to three tactical advantages that currently have find+play mechanics but zero camp presence, exposure risk, or heat consequences.

---

## Problem

Team Swap, Vote Block, and Vote Steal are "invisible stealth weapons." They're discovered at camp and played at tribal with proper mechanics, but:
- No one ever learns the holder has them (no confession, leak, or snoop)
- No heat modifiers for known holders (no targeting pressure)
- No camp events (no narrative presence between find and play)
- No bigMoves credit (Team Swap only — the others are tactical)
- No bond consequences beyond the play itself

Every other advantage (idol, legacy, amulet, second life, KiP) has a full social lifecycle. These three don't.

---

## Design

### Drama Tiers

| Advantage | Drama Level | Confession | Leak | Snoop | Heat | bigMoves |
|-----------|-------------|------------|------|-------|------|----------|
| Team Swap | Medium | Yes (idol pattern) | Yes | Yes | +0.6 | +1 on play |
| Vote Block | Low | No | Yes | Yes | +0.3 | No |
| Vote Steal | Low | No | Yes | Yes | +0.3 | No |

---

### 1. Known Holder Tracking

**New Sets:**
- `gs.knownTeamSwapHolders` — persistent across episodes
- `gs.knownVoteBlockHolders` — persistent across episodes
- `gs.knownVoteStealHolders` — persistent across episodes

All three added to `SET_FIELDS` in `prepGsForSave()` and `repairGsSets()`.

Holders removed from the Set when advantage is consumed (played or expired).

---

### 2. Discovery Camp Events

When found via `findAdvantages()`, inject a camp event into that tribe's `pre` events.

**Team Swap:**
- Badge: gold "Found Advantage"
- Text: references strategic weight — moving between tribes is game-changing
- Bond: none (solo discovery)

**Vote Block:**
- Badge: gold "Found Advantage"
- Text: simpler, tactical framing
- Bond: none

**Vote Steal:**
- Badge: gold "Found Advantage"
- Text: tactical framing (similar to Vote Block)
- Bond: none

All three use duo portrait format (finder + advantage icon implied by badge).

---

### 3. Team Swap Confession System (idol pattern)

**Location:** `generateCampEvents` post phase, alongside existing confession checks.

**Trigger:** ~15% chance per episode holder is alive and has the advantage. Roll: `social * 0.03`.

**Target:** Highest-bond active tribemate with bond >= 2.

**Effects:**
- Confidant added to `gs.knownTeamSwapHolders`
- Bond: +0.3 holder → confidant (trust gesture)
- Camp event type: `teamSwapConfession`
- Badge: gold "Confession"
- Duo portrait: holder + confidant

**Leak from confidant:** No separate system — if the confidant is at a feast, the standard feast intel-leak pipeline handles exposure from there.

Vote Block and Vote Steal do NOT have confession systems. Their only exposure paths are feast leak and snoop.

---

### 4. Feast Intel-Leak Integration

**Change:** Expand the advantage type filter in feast intel-leak logic (currently `['idol', 'legacy', 'amulet', 'secondLife']`) to include `'teamSwap'`, `'voteBlock'`, `'voteSteal'`.

**On leak:**
- All feast attendees added to the relevant `gs.known*Holders` Set
- Camp event with red "Exposed" badge
- Standard feast leak narrative (loose lips at the feast)

No other changes to the feast system needed — it already handles the full leak flow.

---

### 5. Snoop System

**Location:** `generateCampEvents` post phase.

**Trigger:** Per-episode, for each holder on a tribe, check each tribemate:
- **Team Swap:** `intuition * 0.02` (2-20%)
- **Vote Block:** `intuition * 0.015` (1.5-15%)
- **Vote Steal:** `intuition * 0.015` (1.5-15%)

Only one snooper per holder per episode (first to roll wins). Skip if all active tribemates are already in the relevant known Set (no one left to discover it).

**Effects:**
- Snooper added to relevant `gs.known*Holders` Set
- Camp event type: `teamSwapSnooped` / `voteBlockSnooped` / `voteStealSnooped`
- Badge: purple "Snooped"
- Duo portrait: snooper + holder
- Bond: no change (secret discovery — holder doesn't know)

---

### 6. Heat Modifiers in computeHeat()

Add three checks after the existing known-holder heat section:

```
if holder in gs.knownTeamSwapHolders → +0.6 heat
if holder in gs.knownVoteBlockHolders → +0.3 heat
if holder in gs.knownVoteStealHolders → +0.3 heat
```

**Team Swap +0.6 rationale:** "Get them before they escape" — meaningful but below idol (+2.0). Pre-merge context makes this especially relevant since tribes are smaller.

**Vote Block/Steal +0.3 rationale:** Tactical awareness, not panic. Same tier as KiP holder (+0.3).

---

### 7. bigMoves Credit

**Team Swap only:** +1 bigMoves on successful play (either self-swap or ally-save).

Added in the Team Swap play logic block after the advantage is consumed and the swap executes.

Vote Block and Vote Steal: no bigMoves credit.

---

### 8. Bond Consequences on Play

**Team Swap — ally save:**
- +1.5 bond (holder → saved ally). Significant — you literally saved their game.

**Vote Block — ally protection:**
- +0.5 bond (holder → protected ally) when blocking someone who was voting against an ally.

**Vote Block — enemy penalty:**
- -1.0 bond (blocked player → holder). Getting silenced is personal.

**Vote Steal:**
- Already has bond consequences in existing code (check and preserve).

---

### 9. VP Camp Event Badges

New badge types in `rpBuildCampTribe()` badgeText/badgeClass block:

| Event Type | Badge Text | Badge Class |
|------------|-----------|-------------|
| `teamSwapFound` | Found Advantage | gold |
| `voteBlockFound` | Found Advantage | gold |
| `voteStealFound` | Found Advantage | gold |
| `teamSwapConfession` | Confession | gold |
| `teamSwapSnooped` | Snooped | red |
| `voteBlockSnooped` | Snooped | red |
| `voteStealSnooped` | Snooped | red |
| `teamSwapExposed` | Exposed | red |
| `voteBlockExposed` | Exposed | red |
| `voteStealExposed` | Exposed | red |

---

## Out of Scope

- Multi-episode arcs (Legacy Sarah Play, Amulet upgrade tension) — these are one-shot advantages
- KiP interaction (KiP can already steal any advantage — no special handling needed)
- Inheritance on elimination (one-shot, consumed on play, no willing)
- Vote reason text mentioning known holders (could be added later but not part of this spec)
