# ThreatScore Redesign

**Date:** 2026-04-12
**Type:** Formula rewrite (existing function, no new systems)

---

## Overview

Rewrite `threatScore(name)` to split threat perception into three components — challenge, social, strategic — equally weighted. The current formula is ~60% raw stats / ~40% challenge record, which makes high-stat players automatically "threats" even if they've never performed. The new formula makes track record, bonds, and alliances the primary drivers, with stats as early-game fallback.

## Current Problems

1. **Stats dominate** — physical 8 player is a "threat" even if they bomb every challenge
2. **Podiums barely matter** — only +0.2 each, should be the PRIMARY challenge signal
3. **Bombs barely matter** — only -0.15, a player who bombs 5 times is still "high threat" from stats alone
4. **Social/strategic not measured** — a player with 5 allies and an idol isn't considered more threatening than a lone wolf
5. **No time component** — episode 1 and episode 10 use the same formula despite vastly different data availability

## New Formula

### 1. Challenge Threat (what you've DONE)

```javascript
const s = pStats(name);
const rec = gs.chalRecord?.[name] || { wins: 0, podiums: 0, bombs: 0 };

// Stat base: challenge-relevant stats only (no social/strategic)
const statBase = s.physical * 0.15 + s.endurance * 0.12 + s.mental * 0.08 + s.intuition * 0.08;

// Record: podiums + wins are positive, bombs are negative
const recordScore = rec.podiums * 1.0 + rec.wins * 1.5 - rec.bombs * 0.8;

// Dynamic weight: record matters more as episodes progress
const episodesPlayed = Math.max(1, gs.episode || 1);
const recordWeight = Math.min(0.7, episodesPlayed * 0.1);

const challengeThreat = statBase * (1 - recordWeight) + recordScore * recordWeight;
```

**Behavior over time:**
- Episode 1: 100% stats (no record exists)
- Episode 4: 60% stats, 40% record
- Episode 7+: 30% stats, 70% record

**Example scores:**
| Player | Stats | Record | Challenge Threat |
|---|---|---|---|
| Ep 1 physical beast (phys 8, end 8) | 2.16 | 0 | 2.16 (pure stats) |
| Ep 7 avg player (1 pod, 2 bomb) | 1.29 * 0.3 = 0.39 | -0.6 * 0.7 = -0.42 | ~0 (barely a threat) |
| Ep 7 challenge beast (4 pod, 1 win, 0 bomb) | 2.16 * 0.3 = 0.65 | 5.5 * 0.7 = 3.85 | ~4.5 (major threat) |
| Ep 7 floater (0 pod, 0 bomb) | 1.5 * 0.3 = 0.45 | 0 | ~0.45 (invisible) |

### 2. Social Threat (how liked/connected you are)

Based on OBSERVABLE in-game data only (not audience popularity — players can't see that).

```javascript
// Average bond across all active players
const activePlayers = gs.activePlayers.filter(p => p !== name);
const avgBond = activePlayers.length 
  ? activePlayers.reduce((sum, p) => sum + getBond(name, p), 0) / activePlayers.length 
  : 0;

// Count of real friends (bond ≥ 3)
const highBondCount = activePlayers.filter(p => getBond(name, p) >= 3).length;

// Showmance/spark bonus (visible couple = jury threat)
const hasShowmance = gs.showmances?.some(sh => 
  sh.phase !== 'broken-up' && sh.players.includes(name) && sh.players.every(p => gs.activePlayers.includes(p))
) || false;
const hasSpark = gs.romanticSparks?.some(sp => 
  sp.players.includes(name) && !sp.fake
) || false;
const showmanceBonus = hasShowmance ? 0.5 : (hasSpark ? 0.2 : 0);

// Social stat as baseline potential
const socialStat = s.social * 0.08;

const socialThreat = avgBond * 0.5 + highBondCount * 0.15 + showmanceBonus + socialStat;
```

**Example scores:**
| Player | Avg Bond | Friends (≥3) | Showmance | Social Stat | Social Threat |
|---|---|---|---|---|---|
| Lone wolf (avg bond 0.5, 0 friends) | 0.25 | 0 | no | 0.24 | ~0.5 |
| Average (avg bond 2.0, 2 friends) | 1.0 | 0.3 | no | 0.40 | ~1.7 |
| Social butterfly (avg bond 3.5, 5 friends) | 1.75 | 0.75 | no | 0.64 | ~3.1 |
| Showmance player (avg bond 3.0, 4 friends) | 1.5 | 0.6 | yes | 0.48 | ~3.1 |

### 3. Strategic Threat (how much control you have)

```javascript
// Alliance power: how many alliances and how big
const activeAlliances = (gs.namedAlliances || []).filter(a => 
  a.active && a.members.includes(name) && a.members.some(m => m !== name && gs.activePlayers.includes(m))
);
const alliancePower = activeAlliances.reduce((sum, a) => {
  const activeMembers = a.members.filter(m => gs.activePlayers.includes(m)).length;
  return sum + activeMembers * 0.2;
}, 0);

// Side deals
const activeSideDeals = (gs.sideDeals || []).filter(d => 
  d.active && d.players.includes(name) && d.players.every(p => gs.activePlayers.includes(p))
).length;
const sideDealScore = activeSideDeals * 0.15;

// Advantages (idol, vote steal, etc.) — having one makes you dangerous
const hasAdvantage = gs.advantages?.some(a => a.holder === name) ? 0.8 : 0;

// Strategic stat as baseline
const strategicStat = s.strategic * 0.08;

const strategicThreat = alliancePower + sideDealScore + hasAdvantage + strategicStat;
```

**Example scores:**
| Player | Alliances | Side Deals | Advantage | Strat Stat | Strategic Threat |
|---|---|---|---|---|---|
| No alliances, no advantages | 0 | 0 | 0 | 0.40 | ~0.4 |
| One 3-person alliance | 0.6 | 0 | 0 | 0.48 | ~1.1 |
| Two alliances (3+4), idol, 2 deals | 1.4 | 0.3 | 0.8 | 0.64 | ~3.1 |
| Mastermind (3 alliances, idol, deals) | 2.0 | 0.45 | 0.8 | 0.72 | ~4.0 |

### Combined Score

```javascript
const threatScore = challengeThreat * 0.33 + socialThreat * 0.33 + strategicThreat * 0.33;
```

Equal weighting — all three dimensions matter the same regardless of game phase. The components themselves naturally shift over time (record grows, bonds deepen, alliances form).

**Combined examples:**
| Player Type | Challenge | Social | Strategic | ThreatScore |
|---|---|---|---|---|
| Episode 1 nobody | 1.5 | 0.5 | 0.4 | ~0.8 |
| Mid-game floater | 0.5 | 1.5 | 0.5 | ~0.8 |
| Challenge beast | 4.5 | 1.5 | 0.8 | ~2.3 |
| Social butterfly | 1.0 | 3.5 | 1.0 | ~1.8 |
| Strategic mastermind | 1.0 | 2.0 | 4.0 | ~2.3 |
| Triple threat | 3.5 | 3.5 | 3.0 | ~3.3 |
| Goat (bombs, no friends, no alliances) | -0.3 | 0.3 | 0.2 | ~0.07 |

### Callsite Threshold Adjustments

Current thresholds in the codebase need scaling. The old range was roughly 3-8, the new range is roughly 0-4.

| Old Threshold | Context | New Threshold |
|---|---|---|
| `>= 5` | Suspected idol target | `>= 2.0` |
| `>= 6` | Emerging threat targetable pre-merge | `>= 2.5` |
| `threatScore(v) * 0.6` | Vote targeting weight | Keep as-is (proportional) |
| `threatScore(x) * 0.3` | Auction strategic scoring | Keep as-is (proportional) |

## What Changes

1. **Rewrite** `function threatScore(name)` — single function, ~30 lines
2. **Adjust** ~3-5 threshold callsites to new scale
3. **No new state, no new data structures, no new functions**
4. **No changes to `updateChalRecord`** — it still tracks podiums/bombs/wins the same way

## What Stays The Same

- `gs.chalRecord` structure unchanged
- `updateChalRecord(ep)` unchanged  
- `computeHeat` unchanged (it calls `threatScore` which now returns better values)
- All challenge scoring unchanged
- Bond system unchanged
- Alliance system unchanged
