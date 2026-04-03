# Safety Without Power

**Date:** 2026-04-03
**Scope:** New advantage type — holder leaves tribal council before the vote. Safe from elimination but can't vote, excluded from voting plans. Medium drama tier with full lifecycle.

**Inspiration:** Survivor's Safety Without Power advantage. The "coward's escape" — you survive, but at the cost of abandoning your alliance.

---

## Problem

No existing advantage lets a player escape tribal entirely. Idols negate votes but you stay and participate. Team Swap moves you to another tribe. Safety Without Power is mechanically distinct: you physically leave, your vote disappears, and the remaining players deal with the fallout.

---

## Design

### 1. Advantage Definition

- **Type:** `'safetyNoPower'`
- **Label:** "Safety Without Power"
- **Drama tier:** Medium
- **Config:** Standard ADVANTAGES entry with enable/count toggle, default 0 (disabled)
- **Discovery:** `findAdvantages()` camp discovery, `postMergeOnly: false`, `baseChance: 0.002`, `epScaleCap: 0.008`
- **Acquisition sources:** Camp discovery + Journey pool (when enabled). Not auction.

---

### 2. Play Logic

Fires in `checkNonIdolAdvantageUse()`, BEFORE `simulateVotes()` runs. The holder must decide before votes are cast.

**Play decision (proportional, uses computeHeat signals):**
- `heat = computeHeat(holder, tribalPlayers, alliances)`
- `playChance = heat * 0.08 + (10 - loyalty) * 0.02 + boldness * 0.02`
- Force play at `advExpire` threshold (same as all advantages)

**Warning decision (one ally max):**
- Find closest ally at tribal: highest bond tribemate with bond >= 2
- Warning chance: `loyalty * 0.06 + bond_with_ally * 0.04`
  - Loyal 8, bond 5 = 68%. Loyal 3, bond 2 = 26%.
- If warned: ally knows holder is leaving. Bond damage reduced. Ally may adjust their vote.
- If not warned: full surprise. Maximum drama and consequences.

**Execution:**
- Remove holder from tribal participation entirely:
  - Remove from `tribalPlayers` (not a voter, not a target)
  - Add to `gs.lostVotes` (can't vote)
  - Remove any votes already cast by holder from `votesObj`
  - Remove any votes cast against holder from `votesObj`
  - Holder excluded from `simulateVotes()` voter pool and voting plans
- Consume the advantage (splice from `gs.advantages`)
- Clean known holder Set: `gs.knownSafetyNoPowerHolders?.delete(holder)`
- Record: `ep.idolPlays.push({ player: holder, type: 'safetyNoPower', warned: warnedAlly || null, surprise: !warnedAlly })`
- Record: `ep.safetyNoPowerPlayed = { holder, warnedAlly: warnedAlly || null, surprise: !warnedAlly }`

---

### 3. Bond & Social Consequences

**If warned ally (warning fired):**
- Warned ally: `addBond(warnedAlly, holder, -0.5)` — mild, "I get it but I wish you stayed"
- Other allies at tribal (bond >= 2 with holder): `addBond(ally, holder, -1.0)` — not warned, feels like abandonment
- Non-allies at tribal: `addBond(player, holder, -0.3)` — general coward perception

**If surprise exit (no warning):**
- All allies at tribal (bond >= 2 with holder): `addBond(ally, holder, -1.5)` — betrayal-level abandonment
- Non-allies at tribal: `addBond(player, holder, -0.3)` — coward perception

**If exit caused an ally to go home (checked post-vote):**
- Extra `addBond(eliminatedAlly, holder, -1.0)` — "your vote could have saved me"
- Stacks with above damage

**Heat next episode:** `+1.0` in `computeHeat` — "they ran last time, flush them before they run again"
- Track via `gs.safetyNoPowerHeat = { player: holder, ep: epNum }` — expires after 1 episode

**bigMoves:** +1 — surviving a dangerous tribal is a resume moment regardless of method

**Popularity (if enabled):**
- Surprise exit: `gs.popularity[holder] += 0.3` — dramatic TV moment, fans love chaos
- Warned exit: `gs.popularity[holder] -= 0.2` — boring, calculated, no shock value

---

### 4. Known Holder Tracking & Lifecycle (Medium Drama)

**New Set:** `gs.knownSafetyNoPowerHolders` — persistent across episodes. Added to `SET_FIELDS` for serialization.

**Confession system (idol pattern):**
- Fires in `generateCampEvents` post phase
- Chance: `social * 0.03` (~3-30%)
- Confides in closest ally (bond >= 2), adds holder to known Set
- Bond: `+0.3` holder → confidant
- Camp event type: `safetyNoPowerConfession`, badge: gold "CONFESSION"

**Feast intel-leak:**
- Add `'safetyNoPower'` to feast intel-leak type filter
- On leak: holder added to known Set
- Badge: red "Exposed"

**Snoop:**
- Chance: `intuition * 0.02` (same as Team Swap — medium drama)
- On snoop: holder added to known Set
- Camp event type: `safetyNoPowerSnooped`, badge: red "SNOOPED"

**Heat for known holders:** `+0.5` in `computeHeat` — people want to flush it but it's less threatening than an idol

---

### 5. VP Display

**Votes screen:**
- "SAFETY WITHOUT POWER" banner when advantage fires
- Holder portrait with "LEFT TRIBAL" badge
- If warned: small note "warned [ally name] before leaving"
- If surprise: dramatic "WALKS OUT" framing

**Camp event badges:**
| Event Type | Badge Text | Badge Class |
|------------|-----------|-------------|
| `safetyNoPowerFound` | ADVANTAGE FOUND | gold |
| `safetyNoPowerConfession` | CONFESSION | gold |
| `safetyNoPowerSnooped` | SNOOPED | red |
| `safetyNoPowerAftermath` | ABANDONED TRIBAL | red |
| `safetyNoPowerEscaped` | ESCAPED | gold |

**Post-play camp events (next episode):**
- If surprise exit: allies react to abandonment, dramatic aftermath
- If warned exit: quieter aftermath, "they saw it coming"
- If exit caused an ally's elimination: guilt/confrontation event

---

### 6. Acquisition Sources

- **Camp discovery:** In `findAdvantages()` nonIdolTypes array, same pattern as teamSwap/voteBlock
- **Journey pool:** Add to journey advantage pool (when enabled in config), same pattern as voteBlock
- **NOT auction:** Doesn't fit post-merge auction power fantasy
- **NOT summit:** Doesn't fit the three-gifts structure

All sources share the same global cap (`gs.advantages.filter(type).length < max`).

---

## Out of Scope

- Warning multiple allies (one max, mirrors idol confession pattern)
- Alliance-wide vote plan adjustment (warned ally adjusts individually, not the whole alliance)
- Interaction with Team Swap (can't stack — you either swap or leave, not both)
- Fire-making or duel triggered by leaving (you just leave, clean exit)
