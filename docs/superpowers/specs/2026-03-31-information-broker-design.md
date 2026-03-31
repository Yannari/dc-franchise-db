# Information Broker — Design

**Date:** 2026-03-31
**Status:** Approved

## Overview
A player in 2+ active alliances with high social and low loyalty becomes a double agent — feeding intel to both sides, gaining bond boosts and vote awareness, but with escalating exposure risk each episode. When caught, bond collapse with both alliances. Once per game.

## Trigger & Eligibility

- **Condition:** Player is a member of 2+ active named alliances AND `social >= 5` AND `loyalty <= 5`
- **Roll:** `social * 0.025 * (6 - loyalty) * 0.1` — proportional, roughly 5-25%
- **When:** Checked once per episode in `generateCampEvents` post-phase
- **Limit:** Once per game — `gs.broker` is set, no second broker can emerge
- **State:** `gs.broker = { player, alliances: [name1, name2], startEp, episodesActive: 0, exposed: false, intel: {} }`

## Active Phase — Per-Episode Effects

Each episode the broker is active and not yet exposed, `gs.broker.episodesActive++`:

### Intel Gain
- Broker learns both alliances' vote targets
- Sets `gs.playerStates[broker].eavesdropBoostThisEp = true` each episode (feeds into idol play awareness + preemptive strike)
- `computeHeat`: broker gets **-0.5 heat** (hard to target someone who's friends with everyone)

### Bond Boost
- `+0.15` bond with all members of both alliances per episode
- The broker is telling everyone what they want to hear — relationships feel solid

### Exposure Risk Escalation
- Base risk: `episodesActive * 0.08` (ep 1 = 8%, ep 2 = 16%, ep 3 = 24%...)
- Merge/swap spike: `+0.30` the episode a merge or swap fires
- Detector selection: among all members of both alliances (excluding broker), pick the one with highest `intuition * 0.04` roll. If the exposure roll fires, THAT player is the named exposer
- Risk cap: 85% — never guaranteed, lucky brokers can ride it to endgame

### Camp Events While Active
One per episode, ~60% chance. Pushed into broker's tribe/merge camp events:

| Event Type | Description | Badge |
|---|---|---|
| `brokerWhisper` | Broker feeds intel to one side ("X told me they're coming for you") | Double Agent (gold) |
| `brokerManipulate` | Broker redirects suspicion away from self onto someone else | Double Agent (gold) |
| `brokerConfidence` | Broker confessional about how well the double game is going (hubris) | Double Agent (gold) |
| `brokerClose` | Someone almost catches on but broker talks their way out | Double Agent (gold) |

## Exposure — The Blowup

When the exposure roll fires:

### Bond Collapse
- All members of both alliances: `-(1.0 + episodesActive * 0.4)` bond with the broker
  - ep 1 = -1.4, ep 3 = -2.2, ep 5 = -3.0
  - Longer you played both sides, worse the fallout
- Light secondary hit between alliance members: `-0.3` each ("how did we not see this?")

### Heat Spike
- `gs.brokerExposedHeat = broker.player`
- Adds **+2.0 heat** in `computeHeat` for 2 episodes after exposure
- Cleared after 2 episodes via episode counter check

### Exposer Reward
- The player who caught the broker (highest intuition roll): **+0.5 bond** with everyone in both alliances
- They uncovered the lie — trust flows to them

### Camp Events on Exposure
Guaranteed, 2-3 events pushed into camp:

| Event Type | Description | Badge |
|---|---|---|
| `brokerExposed` | The confrontation. Exposer calls out the broker. Two tonal variants: bold exposer (public callout) vs strategic exposer (quiet then public). | EXPOSED (red) |
| `brokerFallout` | Alliance members react. Trust shattered. Processing what happened. | Trust Shattered (red) |
| `brokerDefense` | Broker's response. Bold: owns it. Low-temperament: melts down. Strategic: tries to spin. | varies (red/gold) |

### State After Exposure
- `gs.broker.exposed = true`
- No more intel gain, no more bond boosts
- Heat penalty persists for 2 episodes
- Broker is now just a player with terrible relationships and a target on their back

## Integration Points

### computeHeat
- While active: `-0.5` heat for the broker
- After exposed: `+2.0` heat for 2 episodes (check `gs.broker.exposed && epNum - gs.broker.exposedEp <= 2`)

### simulateVotes
- No direct modification — the bond boosts/collapses naturally influence vote targeting
- Broker's eavesdrop flag helps with preemptive strikes and idol play awareness

### checkAllianceQuitting
- After exposure, the broker will likely quit both alliances naturally (bond collapse → avgBond drops → quit triggers)
- No special-case needed — existing quit mechanics handle this

### patchEpisodeHistory
- Save `ep.brokerEvents`, `ep.brokerExposure` to episode history

### snapshotGameState
- Include `gs.broker` in snapshot (plain object, no Sets)

## VP Display

### Badges
- Active events: gold "Double Agent" badge
- Exposure events: red "EXPOSED" / "Trust Shattered" badges
- `brokerDefense`: red if meltdown, gold if owns-it

### Two-Player Events
- `brokerExposed` is a two-player event (broker + exposer) — dual portrait
- `brokerWhisper`/`brokerManipulate` are two-player (broker + target alliance member)
- `brokerConfidence`/`brokerClose` are single-player (broker solo)

### Drama Scoring
- +2 drama per episode while broker is active
- +4 drama on exposure episode
- Exposer gets +2 drama on exposure episode
- Broker gets -2 likability on exposure

### Spot Types
All broker event types added to `spotTypes` set for camp event display

## Implementation

- New function: `checkInformationBroker(ep)` — called in `generateCampEvents` post-phase after `checkParanoiaSpiral`
- Handles: eligibility check → activation OR active-phase effects OR exposure check
- Single function, three code paths based on `gs.broker` state (null / active / exposed)
- Camp event text: 3-4 variants per event type, personality-driven selection
- Badge handling in `rpBuildCampTribe()` badgeText/badgeClass chains
