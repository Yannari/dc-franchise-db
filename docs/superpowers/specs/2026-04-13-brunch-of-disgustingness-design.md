# Brunch of Disgustingness — Design Spec

## Summary

A merge-episode eating challenge twist inspired by TDI S1E14. Players split into temporary boys vs girls teams, navigate cabin social dynamics, then face a 9-course gross food eating challenge. All members must eat each course for the team to score. Chain vomiting spreads across both teams. Eat-off tiebreaker if tied. Winning team gets immunity + survival food restoration (or advantage if survival disabled). Losing team goes to tribal. VP themed as a gross-out game show in a TDI camp canteen.

## Twist Setup

### Catalog Entry

- `id: 'brunch-of-disgustingness'`
- `emoji: '🤮'`
- `name: 'Brunch of Disgustingness'`
- `category: 'challenge'`
- `phase: 'post-merge'`
- `engineType: 'brunch-of-disgustingness'`
- No incompatibilities — compatible with no-tribal and other twists

### applyTwist Behavior

Sets `ep.isBrunchOfDisgustingness = true`. Splits active players into boys and girls teams based on pronouns.

**Balancing uneven teams:** If one gender group is larger, 1-2 players from the larger group cross over to the smaller (picked by lowest average bond with their own gender group — the "odd one out" narrative). Stored as:

```javascript
ep.brunchTeams = {
  boys: [...],    // player names
  girls: [...],   // player names
  crossovers: [{ name, from, to }]  // who switched and which direction
};
```

### Immunity & Tribal

- Winning team ALL get immunity — merged into `ep.extraImmune` (never overwrite)
- Normal merge tribal follows with only the losing team vulnerable
- If no-tribal twist is also scheduled, no tribal happens — pure reward challenge

### Reward

- **Survival enabled:** Winning team gets food/water restoration (like a reward challenge win). Losing team gets nothing.
- **Survival disabled:** MVP eater on winning team receives a minor advantage from the existing advantage system (extra vote, vote blocker, or immunity totem).
- **Both cases:** Winning team bond boost (`+0.5` all pairs), losing team tension (`-0.2` all pairs).

## Cabin Dynamics Phase

Replaces normal pre-challenge camp events for this episode. Fires after the boys/girls split, before the eating challenge.

### Event Generation

Each team draws **7-8 events** from a shared pool (not gendered). Event selection weighted by team bond structure and archetypes:
- Teams with worse internal bonds get more confrontation events
- Teams with better bonds get more bonding events
- Both always get at least one power dynamics event

### Shared Cabin Event Pool

**Bonding (draw if team has decent cohesion):**
- Burping/arm wrestling/physical contest — highest boldness or physical wins, crowned informal champ. Winner gets `+0.2` bond with team.
- Raiding the mini fridge — if survival enabled, food interaction. Guilt moment or shared feast.
- Group trash-talking the other team — cohesion boost `+0.1` all pairs. Players with showmance partner on other team stay quiet (noticed by others, `suspicion` narrative).
- Card game — strategic players dominate, social players keep it fun. `+0.1` bond between participants.
- Impressions of the host — boldness check. Success = team laughs, `+0.1` cohesion. Fail = awkward silence.
- Wrestling/roughhousing goes too far — two highest physical players. Bond shift based on sportsmanship: graceful winner `+0.2`, salty loser `-0.2`.
- Someone shares a personal story — late night real talk. `+0.3` bond boost between sharer and closest listener (highest social player).
- Someone does something unexpectedly impressive — underdog/floater moment. Respect boost `+0.2` from team.

**Power Dynamics (always at least 1 per team):**
- Highest strategic player claims best bunk / asserts dominance — others react by bonds. Low-bond players resent (`-0.2`), high-bond players defer.
- Power player offers favors to the outsider — recruitment attempt. Others see through it (strategic ≥ 6 spots it) or don't.
- Former alliance members reunite — power bloc forms, others notice (`-0.1` bond with non-members who feel excluded).
- Someone calls out the power player — boldness check. Success = faction split, power player loses social capital. Fail = challenger looks petty.
- Line drawn down the cabin — two factions form based on bond clusters. Outsider/new arrivals must choose a side (bond-based gravitational pull).
- Secret meeting — strategic players form sub-alliance, someone overhears (intuition check). If caught: `trust damage -0.3` with the eavesdropper.
- Someone tries to strategize about the vote — "we might not even go to tribal" tension. Strategic players engaged, others annoyed.
- Someone orchestrates a group vote target pitch — bold strategic play. Team either aligns (cohesion boost) or splinters further.

**Social (draw if team has mixed bonds):**
- Peacemaker organizes group activity — social stat check. Success = cohesion boost `+0.15` all pairs. Fail = forced fun, makes it worse.
- Someone breaks down from merge stress — comfort moment. High social players comfort (`+0.3` bond), low social players awkward.
- Bonding over shared experience — two mid-bond players (1-3) have a genuine conversation. `+0.4` bond boost.
- Someone isolates themselves — others decide whether to check on them (social/loyalty check) or leave them. Check-in = `+0.3` bond. Ignored = `-0.1` bond.
- Confessional moment — private archetype-flavored reaction to new team. Generates VP text only.
- Someone snores — comedy event. Mild tension with light sleepers.
- Alliance pitch disguised as casual conversation — strategic player recruits. If the target has low bond with the pitcher, they see through it.
- Group meal before the challenge — last bonding moment. Cohesion gets final adjustment.

**Confrontation (draw if team has bad bonds):**
- Worst-bond pair argues over something petty — erupts into real grievances. `bond -0.5` between them, team forced to pick sides.
- Accusation of riding coattails — boldness + strategic response. The accused responds by archetype: villain dismisses, hero gets hurt, hothead explodes.
- Power player turns people against a target — manipulation check (`strategic * 0.04 + social * 0.03`). If caught by intuitive player = backfire, manipulator exposed, `-0.5` bonds.
- Former enemies forced to share space — tension event. Resolution depends on whether anyone mediates (social check). Truce = `+0.2` bond. No truce = `-0.3` bond.
- Someone accuses another of being fake — boldness check. Creates lasting friction `bond -0.4`.
- Loud argument heard by other cabin — other team's cohesion gets a tiny boost (they hear the dysfunction).

**Crossover Player Events (if applicable):**
- Team skeptical of crossover — trust check based on existing bonds with the team
- Crossover tries too hard to fit in — awkward moment, mild sympathy or mockery
- Crossover vibes better with new group — surprise cohesion boost `+0.2` with team

### Showmance/Romance During Cabin Phase

- Showmance pairs split across teams — separation moment (longing text, `bond -0` but narrative weight)
- Showmance pairs on same team — comfort moment, `+0.2` bond
- Romance spark checks via `_challengeRomanceSpark()` for players bonding through the new team dynamic

### Team Cohesion Score

Calculated from average pairwise bonds within the team, normalized 0-1. Affected by cabin events.

**Effect on eating challenge:**
- High cohesion (>0.6): teammates encourage each other, `+0.02` to all eating rolls
- Medium cohesion (0.3-0.6): neutral, no modifier
- Low cohesion (<0.3): fractured team, `+5%` refusal chance, no peer encouragement bonus

## Eating Challenge: 9 Courses

### Food Pool

5 disgust categories, 15-20 dishes each (drawn without replacement across 9 courses):

| Category | Refusal triggers | Examples |
|---|---|---|
| **Meat-gross** | Hero/loyal-soldier, low boldness | Bovine testicles, mystery meat stew, pig snout pate, tongue tartare, tripe tacos, brain fritters, sweetbread sliders, head cheese, blood sausage, chicken feet soup, haggis, rocky mountain oysters, liver smoothie, oxtail jelly, meat mystery loaf |
| **Bug-gross** | Low boldness + high social | Live grasshopper pizza, cockroach crumble, beetle bruschetta, cricket casserole, mealworm muffins, ant egg omelette, scorpion skewers, tarantula tempura, fly larvae risotto, centipede ceviche, wasp cracker, locust loaf, silk worm sushi, grub goulash, mosquito mousse |
| **Texture-gross** | Low endurance | Earthworms in snail slime, pre-chewed gum, hairball pasta, slug souffle, mucus meringue, gelatin eyeballs, fish scale flakes, toenail croutons, skin pudding, blister broth, earwax caramel, dandruff dust seasoning, scab brittle, belly button lint balls, pus pastry |
| **Mystery-gross** | Low boldness | Sandal painted with a happy face, bunion soup with hangnail crackers, dumpster juice cocktail, toilet seat tartine, gym sock tea, armpit sweat lemonade, belly button lint soup, dryer lint loaf, used bandaid bisque, mystery can roulette, floor sweepings pie, dust bunny donut, old sponge sashimi, drain hair dumpling, lint roller lollipop |
| **Morally-questionable** | Hero/loyal-soldier, high loyalty | Dolphin wieners, endangered fish sushi, baby seal jerky, panda bear pepperoni, whale blubber bites, unicorn burger (horse meat), bald eagle eggs benedict, koala kebab, sea turtle soup, manatee meatball, dodo bird drumstick, puffin poutine, penguin pot pie, albatross alfredo, narwhal nuggets |

Each dish has: `{ name, desc, category }` with flavor text describing the look/smell/texture.

### Per-Course Flow

1. **Dish reveal** — random dish from pool, no category repeats for 2 consecutive courses
2. **Refusal check** — fires BEFORE the eating roll. Archetype + stat based:
   - Base refusal chance: `(10 - boldness) * 0.02` (boldness 3 = 14% base chance)
   - Category modifier: `+0.10` if archetype matches refusal trigger
   - Cohesion modifier: `+0.05` if team cohesion < 0.3
   - Wildcard: flat 8% chance to refuse ANY category unpredictably
   - Chain vomit hangover from previous course: `+0.05` if affected
3. **Pressure-to-eat** — if someone refuses, highest-social teammate attempts to convince:
   - Convincer: `social * 0.04 + loyalty * 0.03`
   - Refuser resistance: `(10 - boldness) * 0.03 + (10 - temperament) * 0.04`
   - If convinced: they eat with `-0.05` penalty to their roll
   - Cross-team partner can also try (showmance/strong bond ≥ 4): same check, but if successful costs convincer `-0.3` bond with own teammates who notice
4. **Eating roll** — per player: `boldness * 0.04 + endurance * 0.03 + strategic * 0.02 + (random * 0.15)` + team cohesion modifier + cross-team encouragement bonus (if applicable)
   - Pass threshold: `0.35`
   - Dominant eat (very high roll, ≥ 0.60): bonus text, player loved it or powered through impressively
   - Fail (< 0.35): couldn't keep it down
   - ALL players on a team must pass for the team to score the point
5. **Chain vomit check** — if any player fails with a very low roll (< 0.20):
   - All players on BOTH teams roll: `endurance * 0.05 + (random * 0.1)`
   - Fail threshold: `0.30`
   - Failed players get `-0.03` penalty to their next course roll
   - Narrative: green cascade across the table
6. **Course result** — team wins (1 point), team loses (0), both fail (0-0 no point)

### Cross-Team Break Events (Courses 3, 6, pre-eat-off)

5+ events fire at each break (selected based on bonds, archetypes, game state):

1. **Showmance encouragement** — partner on other team mouths "you got this." Target gets `+0.03` eating bonus next course. Encourager gets `-0.3` bond with own teammates who notice.
2. **Strong-bond encouragement** — non-showmance ally (bond ≥ 4) gives a nod. Target gets `+0.02` eating bonus. Encourager gets `-0.2` bond with accusers on own team.
3. **Cross-team trash talk** — rival taunts someone who struggled. Target response based on temperament: low temperament = chokes (penalty `-0.03` next course), high temperament = rage-eats (bonus `+0.03` next course).
4. **Strategic whisper** — high strategic player pitches post-merge alliance to someone on other team. `+0.3` bond between them. If caught by teammate (intuition check): `-0.5` bond with spotter, "traitor" narrative.
5. **Accusation of throwing** — teammate accuses someone of not trying. If unfair (player's score was actually decent): team cohesion drops `-0.1`. If fair: accused gets motivated (bonus) or shuts down (penalty) based on temperament.
6. **Rivalry escalation** — two enemies on opposite teams get into it across the table. Both teams' cohesion affected `-0.05`. Their teammates either back them up (`+0.1` bond within team) or tell them to shut up (`-0.1` bond but cohesion preserved).
7. **Defection temptation** — crossover player visibly miserable. Someone from other team says "should've been with us." Crossover's loyalty tested: low loyalty + bad cohesion = mentally checks out (penalty `-0.04` remaining courses).

### Eat-Off Tiebreaker

Fires if tied after 9 courses (both teams failed some courses, e.g., 4-4, 3-3).

- **Participants:** Best eater from each team (highest cumulative eating score across 9 courses)
- **Format:** 15 cockroach smoothie shots
- **Per-shot roll:** `endurance * 0.05 + boldness * 0.03 + (random * 0.1)`
- **Fail threshold:** `0.30` — increases by `0.02` per shot (fatigue: shot 15 threshold = `0.58`)
- **First player to fail stops.** Whoever drank more wins.
- **If both fail on same shot:** Sudden death — one more shot each. If both fail again, random coin flip.

### Scoring (chalMemberScores)

Per player:
- `+1.0` per course personally eaten
- `+0.5` bonus for dominant eats (roll ≥ 0.60)
- `-2.0` for refusals
- `-1.0` for triggering chain vomit (very low fail)
- Eat-off: `+3.0` for winner, `+1.0` for loser
- Team cohesion contribution: small modifier from cabin dynamics

### Reaction Text Pools

All reactions stat-proportional and archetype-flavored.

**Eating success — by archetype:**
- Villain/schemer: smug, weaponizes the moment, taunts other team
- Hero/loyal-soldier: powers through grimacing, does it for the team
- Chaos-agent: enjoys it, asks for seconds, disturbs everyone
- Wildcard: unpredictable — might refuse crackers but love bugs
- Underdog/floater: proving themselves, surprises the table
- Showmancer/social-butterfly: dramatic, plays to the crowd
- Mastermind: clinical, "it's just protein"
- Hothead: angry-eats, slams plate after

**Eating success — by method (5+ per type):**
- Held nose and swallowed
- Meditated through it (Bridgette technique)
- Poured it straight down the throat
- Chewed exactly once then swallowed whole
- Covered in hot sauce first
- Stared at ceiling entire time
- Ate it so fast nobody could tell if brave or panicked
- Put it between crackers "like that makes it a sandwich"

**Struggling but succeeding (5+):**
- Gagging mid-bite, jaw locked, talked through opening mouth
- Swallowed but couldn't speak for 30 seconds
- Tears streaming, "I'm not crying, my eyes are watering"
- Finished plate then walked outside for a full minute
- "Technically ate it" — held in mouth for countdown

**Refusing (5+ per type):**
- Moral refusal: "I won't eat that. I don't care if we lose."
- Disgust refusal: physically can't, opens mouth, gags, pushes away
- Protest refusal: "This isn't food. This is a war crime."
- Strategic refusal: "I'd rather go to tribal"
- Negotiation attempt: "What if I eat half?" — host says no
- Stare-down: looked at it so long host asked if trying to kill it with eyes
- Halfway fail: started eating, got halfway, couldn't finish

**Convinced to eat (5+):**
- Teammate coaches through it, hand on shoulder
- Cross-team partner mouths encouragement
- Peer pressure: everyone staring, social shame pushes through
- Self-motivation: closes eyes, deep breath, just does it
- Anger-driven: "Fine. FINE." eats it aggressively

**Chain vomit (5+):**
- Initial vomiter: different text for each trigger
- Sympathetic vomiter: "I was fine until I saw THAT"
- Domino effect: "one by one the table fell"
- Resistant: "somehow kept it together while everyone around them lost it"

**Post-eating (5+):**
- Sat very still, breathed through nose
- Made a noise that wasn't a word
- Smiled — nobody believed the smile
- Burped and the entire table flinched
- "Never speak of this again"

**Spectator reactions from other team (5+):**
- Impressed: "Even [rival] had to respect that"
- Disgusted: turned away watching
- Taunting: "That's it? We finished ours already"
- Nervous: watching success, realizing they're next

## Post-Challenge Cabin Events

Each team draws **7-8 events** from the post-challenge pool.

### Winning Team Pool

- Victory celebration — trash talk about losing team, `+0.1` cohesion all pairs
- MVP eater praised — highest scorer gets social capital, `+0.3` bond with team
- "We never have to eat that again" relief bonding — `+0.1` all pairs
- Someone admits they almost quit — vulnerability, `+0.3` bond with whoever encouraged them
- Winners mock losers' worst moment — if showmance split, awkward tension (`-0.2` bond with partner)
- Planning for the future — strategic players pitch post-merge alliances while spirits high
- Crossover player accepted — "you're one of us now" if they performed well, `+0.3` bond
- Resort excitement — anticipation of the reward, team bonds further `+0.1`
- Someone checks on their showmance partner on the losing side — sneaks away, `+0.2` bond with partner, `-0.1` with teammates if caught

### Losing Team Pool

- Blame game — weakest eater confronted, `bond -0.5` between accuser and accused
- Someone defends the worst eater — loyalty moment, `+0.3` with defended, `-0.2` with accusers
- Pre-tribal scramble — strategic players pitch votes while emotions raw
- "We should've eaten faster" regret — team frustration, cohesion drops `-0.1` all pairs
- Moral refuser stands ground — "I'd do it again" moment. Some respect `+0.2`, some anger `-0.3`
- Crossover player scapegoated — "you weren't even trying" if poor performance
- Fractured team splits further — cabin factions harden based on challenge performance
- Someone cries — emotional fallout, comfort check based on social/bonds
- Revenge promise — someone vows to win next challenge, determination narrative

### Both Teams

- Showmance reunion — partners from opposite teams find each other after challenge, `+0.2` bond
- Cross-team respect — someone acknowledges rival's performance
- Chain vomit aftermath — cleanup scene, someone is still sick
- Confessional processing — archetype-flavored private reaction to the whole experience

## VP Theme: Gross-Out Game Show Canteen

### Palette

| Element | Color | Usage |
|---|---|---|
| Background | `#1a2118` (grimy cafeteria grey-green) | Page backgrounds |
| Primary accent | `#4ade80` (slime green) | Headers, success, course wins |
| Warning | `#facc15` (nausea yellow) | Struggle states, caution |
| Sick | `#84cc16` (sick green) | Chain vomit, gagging |
| Refuse/fail | `#f85149` (red) | Refusals, fails, stamps |
| Success | `#2dd4bf` (confident teal) | Dominant eats, MVP |
| Splatter | `#4ade80` (slime green) | Burst effects behind results |
| Text | `#d4d4c8` (cafeteria tray off-white) | Body text |
| Muted | `#8b949e` | Secondary text |

### VP Screens

**Screen 1: The Split (announcement)**
- Mess hall backdrop, grimy cafeteria green
- "BRUNCH OF DISGUSTINGNESS" title in slime green with splatter effect
- Host quote introducing the boys vs girls split
- Two columns: boys team and girls team with portraits
- Crossover player(s) highlighted with arrow showing they switched
- Team cohesion meter preview

**Screen 2: Cabin Dynamics (replaces camp)**
- Split screen — Team A cabin left, Team B cabin right
- Events as cards with portraits and text, bond shifts inline
- Faction lines visible — portraits clustered by sides
- Confessional moments in styled quote blocks
- Team cohesion bar at bottom of each cabin — fills/cracks based on events
- 7-8 events per cabin, sequential reveal

**Screen 3: The Brunch (9 courses + eat-off)**
- Cafeteria table layout — two teams facing each other
- Per course: dish slides in on cafeteria tray, plate cover lifts animation
- Stink lines float up from dish
- Per-player eating: portrait color shifts (normal → pale → green → sick)
- Refusal stamp: big red "REFUSED" slam
- Convinced-to-eat moment: convincer portrait + arrow + refuser portrait
- Chain vomit: green ripple cascade across portraits
- Course scoreboard: slime meter fills per team (0-9)
- Cross-team break cards at courses 3, 6 with social events
- Eat-off section: two portraits side by side, shot glass counter fills one by one

**Screen 4: Aftermath + Results**
- Final score — big slime-styled numbers
- Winning team: green confetti splatter
- Losing team: grey-out with dripping slime overlay
- MVP eater badge, worst eater badge
- Post-challenge cabin events (7-8 per team)
- Reward graphic (food restoration or advantage)

### Overdrive Effects (CSS keyframes)

- `suPlaceLift` — plate cover lift on dish reveal (scale Y 1→0 with opacity)
- `suStinkFloat` — wavy green lines drifting upward (translateY + opacity cycle)
- `suSplatBurst` — green splatter behind course results (scale 0→1.5→1)
- `suTraySlide` — cafeteria tray slides in from side (translateX)
- `suPortraitSick` — portrait filter transition through pale/green/sick stages
- `suRefuseStamp` — red "REFUSED" slams down (scale + rotation)
- `suVomitRipple` — green ripple cascading across both teams (wave animation)
- `suShotFill` — shot glass fills with green liquid (height transition)
- `suShotDrain` — glass tilts and empties (rotate + opacity)
- `suSlimeDrip` — slime drips down on losing team's score (translateY)
- `suGagShake` — card shakes when someone gags (translateX oscillation)
- `suCohesionCrack` — crack animation on cohesion bar when it drops (clip-path)
- `suConfettSplat` — green splatter confetti for winners

## Data Stored on ep

```javascript
ep.isBrunchOfDisgustingness = true;
ep.brunchTeams = { boys: [...], girls: [...], crossovers: [{ name, from, to }] };
ep.brunch = {
  cabinEvents: { teamA: [...], teamB: [...] },  // pre-challenge cabin events
  teamCohesion: { teamA: 0.0-1.0, teamB: 0.0-1.0 },
  courses: [{
    courseNum: 1-9,
    dish: { name, desc, category },
    teamAResults: [{ player, roll, result: 'pass'|'fail'|'dominant'|'refused', reaction, convincedBy? }],
    teamBResults: [{ player, roll, result, reaction, convincedBy? }],
    chainVomit: [{ trigger, affected: [...], reactions: [...] }],
    teamAWon: bool, teamBWon: bool,  // both false = no point awarded
  }],
  crossTeamBreaks: [{ afterCourse: 3|6, events: [...] }],
  eatOff: null | {
    teamAEater: name, teamBEater: name,
    shots: [{ shotNum, teamARoll, teamBRoll, teamAResult, teamBResult }],
    winner: name, winnerTeam: 'teamA'|'teamB',
  },
  score: { teamA: 0-9, teamB: 0-9 },
  winningTeam: 'teamA'|'teamB',
  mvpEater: name,
  worstEater: name,
  postCabinEvents: { teamA: [...], teamB: [...] },  // post-challenge events
};
```

## Text Backlog

Phase-grouped:
- THE SPLIT — team composition, crossovers
- CABIN DYNAMICS — per-team events
- THE BRUNCH — per-course: dish, per-player results, chain vomit, cross-team breaks
- EAT-OFF (if applicable) — shot by shot
- AFTERMATH — score, MVP, post-challenge events

## Cold Open Recap

Dungeon-style card with slime green border. Shows: winning team, final score, MVP eater, number of refusals, number of chain vomits.

## Camp Event Replacement

When `ep.isBrunchOfDisgustingness` is true, the cabin dynamics phase replaces normal pre-challenge camp events. Post-challenge cabin events replace normal post-challenge camp events. The challenge itself generates its own camp events with badges:

**Badges:**
- `MVP EATER` (teal) — highest individual eating score
- `IRON STOMACH` (teal) — ate every course without struggling
- `CHAIN REACTION` (sick green) — triggered a chain vomit
- `REFUSED` (red) — refused a course
- `CONVINCED` (yellow) — was convinced to eat after refusing
- `EAT-OFF CHAMPION` (slime green) — won the tiebreaker
- `TEAM PLAYER` (teal) — convinced a teammate to eat

## What's NOT In Scope

- No permanent tribe changes — the boys/girls split is for this episode only
- No heat system — bond adjustments from cabin/challenge events already capture social fallout
- No changes to tribal council mechanics — losing team goes to normal merge tribal
- No interaction with Redemption/Rescue Island mechanics
