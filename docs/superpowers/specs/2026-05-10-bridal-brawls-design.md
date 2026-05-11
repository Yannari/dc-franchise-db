# Bridal Brawls — Complete Challenge Spec

**Based on:** Total Drama World Tour S3E19 "Niagara Brawls"
**Phase:** Post-merge (individual immunity, but pair-based mechanics)
**Challenge Style:** `social`
**Challenge Series:** `world-tour`
**Immunity:** Winning pair BOTH get immunity

---

## Overview

A casino slot machine randomly pairs players into "wedding couples." Pairs race through a blindfolded obstacle course (trust phase), carry each other across a tightrope over a massive waterfall with sharks (danger phase), then answer bond-based trivia at a customs gate (knowledge phase). Best combined pair score wins — both partners get immunity.

---

## Phase 0 — Slot Machine Pairing

### Pair Count
```
pairCount = floor(active.length / 2)
oddPlayerOut = active.length % 2 === 1  // last player joins weakest pair as "wedding crasher"
```

### Pairing Algorithm
Score every possible pair `(a, b)`:
```
dramaScore = abs(getBond(a, b)) * 1.5              // high drama = strong love OR strong hate
              + (isShowmance(a, b) ? -3 : 0)        // split showmances apart (more drama)
              + (isRival(a, b) ? 4 : 0)              // rivals together = gold

romanticScore = romanticCompat(a, b) ? 2.0 : 0      // sexuality-aware bias

pairWeight = dramaScore * 0.25 + romanticScore * 0.15 + Math.random() * 0.60
```
- 60% random, 25% drama, 15% romantic compatibility
- Greedy assignment: sort all possible pairs by weight descending, assign top pair, remove both from pool, repeat
- If odd player remains: joins the pair with lowest combined pairWeight as a "third wheel" (wedding crasher — gets score penalties)

### Role Assignment (within each pair)
Each player gets a **guide score**:
```
guideScore = 0
// Archetype drive
if (['mastermind','schemer','villain','challenge-beast'].includes(archetype)) guideScore += 3
if (['hero','perceptive-player'].includes(archetype)) guideScore += 2
if (['hothead','chaos-agent','wildcard'].includes(archetype)) guideScore += 1
if (['goat','floater','underdog','showmancer'].includes(archetype)) guideScore -= 1
if (['social-butterfly','loyal-soldier'].includes(archetype)) guideScore += 0

// Stat tiebreaker
guideScore += (social * 0.3 + strategic * 0.2) + noise(1.5)
```
Higher guideScore = **Guide** (eyes open, gives directions). Lower = **Blindfolded** (must trust partner).

---

## Phase 1 — Blindfolded Obstacle Course ("Dress Hunt")

The blindfolded partner navigates through obstacles guided by their partner's voice. Goal: find a wedding dress at the end of the course.

### Course Structure
**6 obstacles**, each is a stat check:

| # | Obstacle | Primary Stat | Secondary Stat | Description |
|---|----------|-------------|----------------|-------------|
| 1 | Mud Pit Crossing | physical (0.06) | endurance (0.04) | Slog through waist-deep mud |
| 2 | Swinging Log Dodge | physical (0.07) | intuition (0.04) | Duck/weave past swinging logs |
| 3 | Slippery Ramp | endurance (0.06) | physical (0.04) | Climb a greased ramp |
| 4 | Hanging Curtains Maze | intuition (0.06) | mental (0.04) | Navigate fabric maze by sound |
| 5 | Collapsing Bridge | boldness (0.06) | physical (0.04) | Sprint across crumbling planks |
| 6 | Dress Grab (finale) | mental (0.05) | intuition (0.05) | Find the correct dress among decoys |

### Obstacle Score Formula
```
guideQuality = guide.social * 0.06 + guide.strategic * 0.04 + noise(2.0)
blindScore   = blind.primaryStat * weight1 + blind.secondaryStat * weight2 + noise(2.5)
trustBonus   = clamp(getBond(guide, blind) * 0.15, -1.5, 1.5)

obstacleScore = (guideQuality * 0.4 + blindScore * 0.6) + trustBonus
```
- **Success threshold:** `obstacleScore > 0.3`
- **Spectacular success:** `obstacleScore > 0.7` → bonus points, crowd pop
- **Failure:** `obstacleScore < 0.0` → time penalty + possible injury event
- **Critical failure:** `obstacleScore < -0.5` → major time penalty + embarrassment

### Time Tracking
```
baseTime per obstacle = 12.0 seconds
successTime   = baseTime * (1.0 - obstacleScore * 0.3)    // better score = faster
failTime      = baseTime * (1.0 + abs(obstacleScore) * 0.5) // worse score = slower
critFailTime  = baseTime * 2.0
```
Total phase time = sum of all 6 obstacle times.

### Trust Events (within pair, ~50% chance per obstacle)
Triggered by bond level and archetype:
```
trustEventChance = 0.50
if (getBond(guide, blind) < -2) trustEventChance += 0.20    // low trust = more drama
if (guide.archetype in ['schemer','villain','mastermind']) trustEventChance += 0.15
```

**Trust event types:**
| Event | Trigger | Effect |
|-------|---------|--------|
| Guide Misdirects | villain/schemer guide, bond < 0 | blind gets +4s penalty, guide gets -1 bond, sabotage narration |
| Partner Panics | blind boldness < 5, obstacle failed | +3s penalty, -0.3 bond, anxiety narration |
| Refuses to Listen | blind strategic > 7 OR bond < -3 | blind ignores guide, re-roll with blind stats only (no guide bonus), ±bond based on outcome |
| Trust Fall Moment | bond > 3, obstacle passed | -2s bonus, +0.5 bond, wholesome narration |
| Guide Encouragement | hero/loyal-soldier guide | +0.2 to next obstacle score, +0.3 bond |

### Sabotage Events (from OTHER pairs, ~30% chance per obstacle)
```
sabotageChance = 0.30
// Only villain/schemer/mastermind archetypes initiate
// Neutral archetypes need strategic >= 6 AND loyalty <= 4
sabotageScore = saboteur.strategic * 0.07 + saboteur.social * 0.04 + noise(2.5)
detectScore   = victim_guide.intuition * 0.06 + victim_guide.mental * 0.04 + noise(2.5)
```
- **Sabotage succeeds** (`sabotageScore > detectScore`): victim pair gets +3s penalty
- **Sabotage detected**: saboteur gets -1 pop, -0.5 bond with both victims, camp event injected
- **Sabotage types:** trip wire, fake directions shouted, path blocked, dress hidden

### Phase 1 Scoring
```
phase1PairScore = (72.0 - totalTime) * 1.0    // 72s = 6 obstacles × 12s base; faster = higher
// Individual chalMemberScores:
guide:  +2 per obstacle partner passed, +1 per trust event triggered, +3 if all 6 passed
blind:  +3 per obstacle passed, +2 per spectacular success, +5 if all 6 passed
saboteur: +2 per successful sabotage, -2 per detected sabotage
```

---

## Phase 2 — Tightrope Carry ("The Big Drop")

The guide carries the blindfolded partner across a tightrope suspended over a massive waterfall. Progressive danger — 5 segments, each harder than the last.

### Segment Structure

| Seg | Name | Distance | Shark Density | Fall Penalty Mult |
|-----|------|----------|---------------|-------------------|
| 1 | Misty Start | 20m | 1 (few) | 1.0× |
| 2 | Gusty Middle | 20m | 2 | 1.5× |
| 3 | Spray Zone | 20m | 3 | 2.0× |
| 4 | Shark Alley | 20m | 5 (many) | 3.0× |
| 5 | Thunder Step | 20m | 7 (swarm) | 4.0× |

### Balance Check (per segment)
```
carrierLoad   = guide.physical * 0.07 + guide.endurance * 0.05 + noise(2.5)
partnerHelp   = blind.endurance * 0.03 + blind.physical * 0.02 + noise(1.0)
windPenalty   = segment * 0.08 + noise(0.5)       // wind gets worse
trustSteady   = clamp(getBond(guide, blind) * 0.08, -0.6, 0.6)

balanceScore = carrierLoad + partnerHelp - windPenalty + trustSteady
```

### Outcomes per Segment
```
if (balanceScore > 0.6)  → clean cross, -2s time bonus, narration: graceful
if (balanceScore > 0.2)  → wobble but safe, normal time
if (balanceScore > -0.2) → near-fall, +3s penalty, scare narration
if (balanceScore <= -0.2) → FALL into water
```

### Fall + Shark Encounter
When a pair falls:
```
fallPenalty_base = 8.0 seconds
sharkDodge = faller.physical * 0.06 + faller.boldness * 0.05 + noise(2.5)
sharkThreshold = 0.2 + segment * 0.12     // harder to dodge at later segments

if (sharkDodge > sharkThreshold):
    sharkPenalty = fallPenaltyMult * 2.0       // quick escape
else:
    sharkPenalty = fallPenaltyMult * 5.0       // shark chase, big penalty
    popDelta(faller, -1)                        // embarrassment

totalFallPenalty = fallPenalty_base + sharkPenalty
```
- Both pair members take the same time penalty (they fall together)
- Pair climbs back up and continues from the segment they fell on
- Max 2 falls per segment before auto-advancing (mercy rule)

### Showmance Moments (during tightrope)
```
if (isShowmance(guide, blind) || getBond(guide, blind) > 5):
    ~40% chance per segment of a romantic moment:
    - "Hold me tighter" → +0.5 bond, +0.3 next balance score
    - Dramatic catch on near-fall → +1.0 bond, +2 pop for catcher
    - Fear confession → +0.8 bond, blindfolded player calms down
```

### Phase 2 Scoring
```
phase2PairScore = (50.0 - totalTightropeTime) * 1.5   // higher weight, harder phase
// Individual chalMemberScores:
guide (carrier):  +3 per clean cross, +1 per wobble, -2 per fall
blind (carried):  +2 per clean cross, +1 per wobble, -1 per fall
shark dodge:      +2 to dodger
showmance moment: +1 to both
```

---

## Phase 3 — Customs Trivia Gate ("The Border")

Pairs who make it across (all do, with varying penalties) face a customs officer who quizzes them about their partner.

### Question Count & Difficulty
```
questionCount = 5
bondLevel = getBond(guide, blind)

// Bond determines difficulty tier
if (bondLevel >= 4)     → easyQuestions (threshold 0.25)
if (bondLevel >= 0)     → mediumQuestions (threshold 0.40)
if (bondLevel >= -3)    → hardQuestions (threshold 0.55)
if (bondLevel < -3)     → brutalQuestions (threshold 0.70)
```

### Answer Formula
Each question, ONE randomly chosen partner answers:
```
answerScore = answerer.mental * 0.07 + answerer.intuition * 0.04 + noise(2.5)
// Bonus if answerer has high bond with partner (they actually know them)
knowledgeBonus = clamp(getBond(answerer, partner) * 0.10, -0.8, 0.8)

finalScore = answerScore + knowledgeBonus
correct = finalScore > difficultyThreshold
```

### Outcomes
```
correct answer:   -3s time bonus (quick pass)
wrong answer:     +5s time penalty (customs holdup) + comedy narration
spectacular wrong (finalScore < threshold - 0.5): +8s penalty + embarrassment pop -1
```

### Phase 3 Scoring
```
phase3PairScore = (correctCount * 6.0) - (wrongCount * 3.0)
// Individual chalMemberScores:
answerer: +3 per correct, -1 per wrong
partner:  +1 per correct (their bond helped), -0 per wrong
```

---

## Final Scoring & Immunity

### Combined Pair Score
```
totalPairScore = phase1PairScore * 1.0 + phase2PairScore * 1.0 + phase3PairScore * 1.0
```
All phases weighted equally — trust, danger, and knowledge all matter.

### Wedding Crasher Penalty (odd player out)
```
If a pair has 3 members (wedding crasher joined):
    crasher's individual contributions are halved
    pair score gets -5.0 penalty (coordination chaos)
    crasher narration: awkward third wheel moments
```

### Immunity
```
winningPair = pair with highest totalPairScore
// BOTH members of winning pair get immunity
ep.immunityWinners = [winningPair.guide, winningPair.blind]

// chalMemberScores: immunity winners get massive bonus
const maxOther = Math.max(0, ...nonWinnerScores)
winningPair.forEach(p => {
    ep.chalMemberScores[p] = Math.max(ep.chalMemberScores[p], maxOther) + active.length + 5
})
```

### ep.extraImmune
Since two players get immunity, merge into `ep.extraImmune`:
```
if (!ep.extraImmune) ep.extraImmune = []
ep.extraImmune.push(...ep.immunityWinners)
// Also set ep.immunityWinner = winningPair.guide (for updateChalRecord 1W credit)
```

---

## Social Events Between Phases

### Between Phase 1 → Phase 2 (~2-3 events guaranteed)
- **Partner blame** (failed obstacles, bond < 2): `-0.8 bond`, camp event
- **Partner respect** (passed all obstacles, any bond): `+0.5 bond`, camp event
- **Rival pair trash talk**: `social vs social` check, loser `-1 pop`
- **Sabotage confrontation** (if sabotage was detected in Phase 1): `-1.5 bond` with saboteur, camp event
- **Showmance spark** (if `romanticCompat` + bond > 2): `_challengeRomanceSpark()`

### Between Phase 2 → Phase 3 (~2-3 events guaranteed)
- **Dramatic rescue gratitude** (fell + partner caught): `+1.0 bond`, camp event
- **Cowardice accusation** (blindfolded player panicked multiple times): `-0.5 bond`, `-1 pop`
- **Shark survivor bonding** (both fell into sharks): `+0.5 bond` (shared trauma)
- **Alliance whisper** (strategic > 6, between different pairs): alliance moment, camp event

---

## Popularity Impacts

| Event | Pop Delta |
|-------|-----------|
| Spectacular obstacle pass | +1 |
| Critical failure (face-plant) | -1 |
| Successful sabotage (undetected) | +0 (secret) |
| Sabotage detected | -2 |
| Clean tightrope cross (all 5) | +2 |
| Fall into sharks (bad dodge) | -1 |
| Dramatic catch/save on tightrope | +2 |
| All trivia correct | +1 |
| Spectacular wrong answer | -1 |
| Wedding crasher (odd player) | -1 (embarrassment) |
| Guide misdirects blindfolded partner | -1 (if caught by audience) |
| Trust fall moment | +1 |

---

## Camp Event Injections

All events pushed to `ep.campEvents[campKey].post[]`:
```
{ players: [a, b], badgeText: 'Sabotage!', badgeClass: 'badge-danger', text: '...' }
```

**Required camp events:**
- Sabotage detected → `badge-danger`
- Trust fall moment → `badge-success`  
- Dramatic tightrope save → `badge-success`
- Partner blame argument → `badge-warning`
- Shark encounter → `badge-danger`
- Wedding crasher awkwardness → `badge-info`
- Showmance spark → `badge-romance`

---

## VP Theme: "Wedding Casino"

**Aesthetic direction:** Gaudy Vegas wedding chapel meets waterfall spray. Gold, white, hot pink, champagne bubbles. Slot machine animations for pairing reveal. Tightrope phase shifts to misty blue/grey with shark fins. Customs gate is passport-stamp bureaucratic aesthetic.

**Screens:**
1. Title Card — "Bridal Brawls" with slot machine
2. Slot Machine Pairing Reveal — animated pair assignments
3. Phase 1: Obstacle Course — per-obstacle cards with trust/sabotage events
4. Phase 1 Results — pair rankings by time
5. Phase 2: Tightrope — per-segment cards with fall/shark encounters
6. Phase 2 Results — updated pair rankings
7. Phase 3: Customs Trivia — question-by-question reveal
8. Final Results — combined scores, immunity announcement

**Sidebar:** Live-updating pair scoreboard, current phase indicator, shark encounter count, trust/sabotage event log.

---

## Integration Points (7 files)

1. **core.js** — TWIST_CATALOG: `{ id:'bridal-brawls', emoji:'💒', name:'Bridal Brawls', chalSeries:'world-tour', chalStyle:'social', phase:'post-merge' }`
2. **twists.js** — `ep.isBridalBrawls = true`
3. **episode.js** — 7+ edits (import, dispatch, skip, guard, hasTwist, exile, ALL history pushes)
4. **vp-screens.js** — import + screen registration
5. **text-backlog.js** — `_textTwistChallenge()` with VP builders
6. **main.js** — import + spread
7. **run-ui.js** — badge tag

---

## Constants Summary

```javascript
const OBSTACLE_COUNT = 6;
const TIGHTROPE_SEGMENTS = 5;
const TRIVIA_QUESTIONS = 5;
const FALL_BASE_PENALTY = 8.0;
const MAX_FALLS_PER_SEGMENT = 2;
const PHASE1_BASE_TIME = 12.0;
const SHARK_DENSITIES = [1, 2, 3, 5, 7];
const FALL_PENALTY_MULTS = [1.0, 1.5, 2.0, 3.0, 4.0];
const DIFFICULTY_THRESHOLDS = { easy: 0.25, medium: 0.40, hard: 0.55, brutal: 0.70 };
const DRAMA_WEIGHT = 0.25;
const ROMANCE_WEIGHT = 0.15;
const RANDOM_WEIGHT = 0.60;
```
