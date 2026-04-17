# Camp Castaways — Design Spec
**Date:** 2026-04-17  
**Phase:** Post-merge only (individual immunity)  
**Type:** Survival-scoring challenge (same engine as Sucky Outdoors)  
**Tribal:** Real unless non-elimination twist is active — behaves as a normal challenge

---

## Overview

A flash flood overnight washes the camp away. Players wake up scattered across a "deserted island" — which turns out to be the same island where Chris and Chef have their hidden production camp. Survival events, forced social proximity, wildlife chaos, and at least one player having a full mental breakdown and bonding with an inanimate object. Immunity goes to the player with the highest personal score across all phases.

---

## Core Mechanics

### Scoring
- Personal scores (`personalScores[name]`) accumulate across all 5 phases
- Post-merge: highest score wins individual immunity
- Tiebreaker: boldness, then mental
- `ep.chalMemberScores = { ...personalScores }` — feeds into tribal heat/targeting downstream
- Score range: roughly −10 to +15 depending on phase events fired

### Separation (Phase 1 start)
Players are randomly split into groups of 1–3, **ignoring alliances and tribes**. Random shuffle + chunk. This creates forced proximity between unlikely pairings — the drama engine of the episode.

Group sizes: solo (1), pair (2), trio (3). If cast is large, prioritize pairs; solos only if cast size doesn't divide evenly.

### Mr. Coconut Breakdown
- Base 30% chance for the player with the lowest (mental + temperament) combined score
- Base 15% chance for the second-lowest
- If fires: player bonds with a random object from the pool
- Object pool: coconut ("Mr. Coconut"), stick ("Sticky" / "Chief"), rock ("Rocky" / "Big Guy"), shell ("Shelly"), driftwood ("The Captain"), empty can ("Cannie"), volleyball-shaped prop ("Wilson")
- Name is assigned from a small flavor pool based on player archetype
- Score impact: −2.0 to affected player (mental deterioration)
- Chris's camera flags it immediately — highest-priority surveillance reaction

### Chris Surveillance Mechanic
`gs._castawaysCamera` — array built during Phases 1–3, each entry: `{ player, type, text, reactionType }`  
Reaction types: `'entertained'` / `'horrified'` / `'impressed'` / `'vindicated'` / `'confused'`  
At Phase 4 (camp discovery): 2–3 entries are drawn and replayed as "PLAYBACK" beats with Chris commentary.  
Chris reaction text fires as a floating label in VP (surveillance mode) — "AND THAT'S THE SHOT I NEEDED." / "INTERN EXPENSE: JUSTIFIED." / "I love this job."

---

## Phases

### Phase 0 — The Flood (Cold Open, no scoring)
- Chris announces over tannoy that production had nothing to do with this (obviously lying)
- Each player gets a short confessional reaction beat: panic / amusement / suspicion / hunger / indifference
- Reaction is archetype-gated:
  - villain/mastermind/schemer: suspicion ("This is a challenge. Has to be.")
  - hothead/chaos-agent: excitement ("FINALLY something interesting.")
  - social-butterfly/showmancer: panic + social framing ("My HAIR.")
  - hero/loyal-soldier: concern for others first
  - underdog/floater: quiet determination
  - wildcard: unpredictable reaction from a dedicated pool
- Pure scene-setting. VP mode: Surveillance / night-vision green. Timestamp starts ticking.

---

### Phase 1 — Scattered (3–5 events per group)
Groups handle survival and social events. Event density: 3 events minimum, up to 5 for larger groups or when drama modifiers fire.

#### SURVIVAL EVENTS

**Food Finding** (fires ~60% of groups)  
Scout food from: coconut palms, tide pools, wild fruit, mushrooms, birds' eggs, Owen's hidden junk food stash.  
- Success: proportional to (intuition * 0.04 + mental * 0.03 + endurance * 0.02). +1.5 score.  
- Fail: −0.5 score, comedy beat.  
- Mishap: slips into water, eats wrong mushroom, seagull steals food. −1.0 score + bond penalty with group.  
- Owen's stash discovery (if Owen is in cast): found by anyone, triggers comedy beat. Finder +1.0, Owen reaction event.

**Shelter Building** (fires ~50% of groups with 2+ members)  
Build crude lean-to / find cave / claim confessional booth / find treehouse.  
- Quality score based on (endurance * 0.05 + mental * 0.04) for the builder.  
- Collapse event: bad builder attempts shelter and it collapses immediately. −1.5, tribe-wide comedy beat.  
- Treehouse discovery: first group to roll this gets it. +2.0 for discoverer. Subsequent groups find it occupied.  
- Confessional booth: Owen special — if Owen is in cast and solo, he stays in the confessional the whole time. Unique event pool for him.

**Wildlife Encounters** (1–2 per group from pool)  
Pool:
- **Shark sighting** (near water groups only): brave = +2.0, panic = −1.5, swim-away = neutral.
- **T-Rex skull** (prop): high-mental player sees through it immediately (+0.5 "CALLED IT"). Low-mental player is terrified (−0.5, comedy). Medium: cautious retreat.
- **Pterodactyl / large goose**: picks up a player briefly. Carried player: if brave = +1.0 comedy triumph; if panic = −1.0. Rescuer who ties rope = +1.5.
- **Python**: freeze-or-flee. Bold player wrestles / taunts it. +1.5 or −1.0.
- **Raccoon raid**: food stolen from group. −1.0 to the player who failed to defend it (lowest intuition).
- **Mosquito swarm**: low-endurance player suffers worst. −0.5 + comedy beat. Others mock them gently.
- **Crab attack**: chases player into water. Comedy beat. −0.5 score, +bond (group laughs together).
- **Wild boar**: solo players only. High-physical can chase it for food attempt. Bold + physical success = +2.0 (hero moment). Failure = running screaming = −1.0 + popularity hit.
- **Seagull steals food**: comedy. −0.5 for victim. Others can't stop laughing.
- **Freshwater sharks**: group near lake. Panic scramble. Brave player who stays calm = +1.5 leadership.

**Fire-Starting Attempt** (~40% chance for groups without a survival-skilled player)  
Lowest-mental player tries to start a fire using completely wrong methods (rubbing plastic, blowing on wet wood, hitting rocks that aren't flint).  
- 3 fail beats before the group gives up. Comedy escalation. −0.5 for the "expert."  
- If a player with high mental+endurance is in the group: they fix it immediately, earn +1.0 and the other's annoyance.

**Getting Lost** (solo players / low-intuition players, ~25% chance)  
Player walks in a wide circle and ends up where they started. −1.5. Confessional comedy beat.  
If a pair is lost: one blames the other. Bond −0.3. If bond was already negative: full argument event.

#### SOCIAL EVENTS (1–2 per group from pool)

**Forced Proximity — Enemies**  
If two players in a group have bond ≤ −2: a friction event fires automatically.  
- Argument about direction / food / survival strategy.  
- Escalation options: cold shoulder, passive-aggressive sniping, full screaming match.  
- Severity proportional to temperament gap. −0.5 each, bond −0.4.

**Forced Proximity — Strangers**  
Two players who rarely interact are stuck together. Awkward small talk → unexpected bonding or deeper dislike.  
- Roll: social * 0.04 + temperament * 0.03. If high: unexpected warmth (+0.5 each, bond +0.3). If low: uncomfortable silence, petty grievance.

**Unexpected Alliance**  
Two players with high strategic who aren't currently allied are in the same group.  
- Roll: if both strategic ≥ 6: 50% chance they quietly discuss strategy. +0.5 each.  
- One player might try to manipulate the other (schemer types): +0.5 schemer, −0.2 target if they notice.

**Vulnerability Confession**  
Solo or isolated pair. Highest-temperament player opens up — reveals why they're out here, something real.  
- 4–5 text options covering: family, money, proving something, fear of failure, loneliness.  
- If pair: other player responds. High social = empathetic response (+0.5 both, bond +0.5). Low social = uncomfortable deflection (bond neutral, solo +0.3 for opening up anyway).  
- Heartfelt beat. Chris's camera flags it with reaction `'confused'` ("Was that... real? Check the budget for therapy interns.")

**Homesickness**  
Low-boldness or underdog player has a quiet moment of missing home.  
- Solo: introspective. +0.3 score (self-awareness).  
- With groupmate: if groupmate is empathetic (high social), bond +0.4. If insensitive (low temperament), irritation event.

**Scheming in Isolation**  
Schemer-eligible player in a group with one target: attempt to plant seeds, lie, or gather intel.  
- Success (social + strategic ≥ 12): target's future vote alignment shifts. +0.5 schemer.  
- Detected (target's intuition ≥ 7): massive backfire. −1.0 schemer, bond −0.5, gs._castawaysCamera flagged.

**Comedy Chaos — Group Argument About Absolutely Nothing**  
Two players argue about something trivial: which direction is north, whether the prop skull is real, whose fault the mosquitoes are.  
- Both take −0.2 from stress. Bond −0.2. But it's funny. Chris reaction: `'entertained'`.

---

### Phase 2 — The Night (3–5 events per group or solo)

Groups have settled somewhere. Darkness. Hunger. Weird sounds. This is where the real drama, comedy, and heartfelt moments concentrate.

#### COMEDY EVENTS

**Sleep Talking**  
Lowest-mental or highest-boldness player talks in their sleep. Reveals something embarrassing or strategic.  
- If strategic secret: everyone in the group now knows it. −1.0 score + strategic exposure.  
- If nonsense/funny: comedy beat. Bond +0.2 for the group (shared laugh).

**2am Breakfast**  
Hunger drives a player (highest hunger / lowest endurance) to try to start cooking at 2am, waking everyone.  
- −0.5 for the cook. Bond −0.2 with those woken. Comedy beat.

**Headhunter Paranoia**  
Low-mental solo player or pair hears jungle sounds and convinces themselves headhunters are on the island.  
- Constructs elaborate stick trap / makes improvised weapon. Comedy escalation beats.  
- Chris reaction: `'entertained'` with an "intern note: do not break character" line.

**Nightmare Scream**  
Low-temperament player wakes screaming from a nightmare, terrifying their group.  
- Group scrambles. Comedy. −0.3 for screamer. Bond +0.2 (shared adrenaline, then laughter).

**Seagull in the Shelter**  
A seagull has gotten into wherever the group is sleeping. Chaos. Food stolen. Someone gets pecked.  
- Multiple comic beats. −0.5 for the person who left food out. Group bond +0.3 (shared absurdity).

#### DRAMA EVENTS

**Old Wounds Surface**  
Two players who have unresolved game history are stuck together at night.  
- The dark and exhaustion makes it come out sideways.  
- High intuition: confrontation feels earned, can resolve (bond recovery +0.3) or escalate (bond −0.5).  
- Low temperament: full blowup. −1.0 each, bond −0.7.

**"I've Been Playing Everyone"**  
High-strategic villain/mastermind player, if isolated with a trusted ally and no one else, may crack and admit the scope of their game.  
- Ally reaction: if loyal = shock + alliance wobble (bond −0.3). If also strategic = grudging respect (bond +0.1).  
- Chris reaction: `'impressed'` / "And THAT is why I signed this cast."

**Hunger Breakdown**  
Lowest-endurance player hits a wall. Not funny — just exhaustion and hunger wearing someone down.  
- Tearful or quietly angry. Others in group react based on their social stat.  
- High social: comfort event fires (see below). Low social: tension/dismissal → bond damage.

**Survivor's Guilt**  
Player reflects on jury members they voted out or betrayed. Moody solo beat.  
- If they have a specific betrayal in `gs.episodeHistory`: the name surfaces in the text.  
- +0.5 self-awareness score. Slight popularity penalty if Chris catches it ("Too on the nose.").

#### HEARTFELT EVENTS

**Stargazing Confession**  
Pair with bond ≥ 1. Quiet, honest moment under the sky.  
- One player says something real. The other responds with something equally real.  
- Archetype-flavored confessions: underdog talks about being underestimated; hero talks about pressure to always be good; villain talks about the exhaustion of always scheming; goat talks about knowing they're being used.  
- +0.5 both, bond +0.5. Romance spark check fires here.

**Comfort in the Dark**  
One player is clearly struggling. Another (high social or loyal archetype) sits with them without trying to fix it.  
- Bond +0.6. +0.3 for the comforter. Heartfelt beat, no comedy angle.

**Unlikely Friends**  
Two players who should not get along — by archetype, by past vote history — find something in common in the dark.  
- Triggers only if bond is between −1 and +1 (neutral ground).  
- Whatever they share: a weird interest, a shared complaint, a mutual dislike of someone else.  
- Bond +0.4. +0.3 each. Chris reaction: `'confused'` ("My villain is BONDING with the underdog? Reshoot.")

**Solo Resolve**  
Solo player, late night. Not a breakdown — the opposite. Clarity.  
- They decide something. A quiet internal shift.  
- +0.5 score. +1 popularity. Archetype-flavored internal monologue.

#### MR. COCONUT BREAKDOWN

Fires during Phase 2. Probabilistic (see Core Mechanics above).

**Beat 1 — Breaking Point**  
Player is alone or their group has fallen asleep. Something small tips them over. Not dramatic — quiet and weird.  
- "It's not even the hunger. Or the cold. Or the bugs. It's the not knowing that breaks them."  
- They find the object. It's just there. They pick it up.

**Beat 2 — Introduction**  
They name it. Based on archetype:  
- villain/mastermind: gives it a strategic name ("You're my secret weapon, [Name].")  
- goat/underdog: names it something genuine ("You don't judge me, do you [Name].")  
- hothead: names it after someone they hate ("You're [Enemy]. And I'm going to outlast you too.")  
- wildcard/chaos-agent: names it something completely unhinged  
- Others: earnest/sincere

**Beat 3 — Conversation**  
One-sided monologue. Player tells the object things they haven't told anyone in the game.  
- 5–6 text options per archetype covering: strategy, loneliness, genuine fear of losing, love for someone back home, something funny.  
- One of these is always a secret that matters to the game (a vote intention, an alliance plan).

**Beat 4 — Others React**  
If in a group (or if someone finds them):  
- amused: comedy reaction, bond neutral  
- concerned: empathetic reaction, bond +0.2  
- judging: eye-roll/dismissive, bond −0.2  
- joining in: if another low-mental player is present, 20% chance they also start talking to the object  

**Chris Camera Flag**: `type: 'breakdown'`, `reactionType: 'entertained'`, text: "THIS is the content I was born to produce."  
Score impact: −2.0 to breakdown player.

---

### Phase 3 — Regrouping (3–4 reunion events)

Groups find each other. Driven by bonds, boldness, and some random chaos.

**Reunion mechanic:** Players with bond ≥ 3 have a 70% chance of seeking each other out. Bold players (boldness ≥ 7) actively search. Low-bond or timid players wait to be found.

#### REUNION EVENT TYPES

**Emotional Reunion (bond ≥ 3)**  
Real relief. Something unspoken gets said.  
- +0.5 both. Bond +0.3. Heartfelt beat.

**Tense Reunion (bond ≤ −1)**  
They find each other. Neither is thrilled.  
- Immediate cold comment. Bond −0.2. −0.3 each from stress.

**The Raft Circles Back**  
One player built a raft, paddled heroically, and ended up exactly where they started.  
- −0.5 for the rafter (embarrassment). Others: bond +0.3 (shared laugh). Chris reaction: `'entertained'`.

**The Pterodactyl Carry**  
Large bird lifts a player briefly. Their groupmate/rescuer ties a rope to their ankle.  
- Carried player: brave = +1.0, panic = −0.5.  
- Rescuer: +1.5, bond +0.4 with carried player.  
- Chris reaction: `'impressed'` or `'horrified'` depending on outcome.

**War Paint Preparation**  
Bold players (boldness ≥ 7) decide to go get Chris. They prepare — improvised weapons, war paint.  
- +1.0 for participants. Timid players who watch: +0.2 for going along.  
- Comedy beats about the quality of the war paint.

**"I Knew It Was A Challenge"**  
High-strategic or suspicious player has been saying this since Phase 0. Finally vindicated — or not.  
- If they found Chris's camp: +1.0 "CALLED IT" + popularity +1.  
- If they were wrong about something specific: comedy deflation, −0.3.

**Mr. Coconut Carrier Still Has Their Object**  
If breakdown fired and the player is still carrying the object when they regroup:  
- Others react (amused, concerned, or start going along with it because isolation is weird).  
- Group event: does anyone else acknowledge the object? Comedy/heartfelt split.

**Shared Suffering Bond**  
Two players who went through something bad together (shared event in Phase 1 or 2) find each other.  
- Bond +0.4. +0.3 each. Brief callback to the shared event in the text.

---

### Phase 4 — Storming the Camp (Climax, 3–5 events)

Players discover Chris and Chef's hidden production camp. The confrontation is inevitable.

**Discovery Beat**  
Smoke visible from the camp. Bold player spots it first.  
- Discoverer: +1.0. Chris camera flags: `'impressed'`.

**The Charge**  
Bold players lead the charge through the jungle. War paint optional.  
- Boldness ≥ 7: charge leader, +2.0, popularity +1.  
- Boldness 4–6: charges with the group, +0.5.  
- Boldness ≤ 3: follows at a safe distance, neutral.

**Chef Scared**  
Chef gets ambushed by players in war paint / with improvised weapons. Drops everything, backs against a tree.  
- Comedy beat per charge leader.  
- Chris reaction: `'vindicated'` ("Worth every penny.").

**Chris Unbothered**  
Chris is sitting calmly. Has clearly been watching. Welcomes them.  
- Player anger events: high-temperament players confront him directly (−0.5 from his dismissal, but +0.5 popularity for fighting back).  
- High-social players try to charm him for information: roll vs Chris's indifference. 30% chance of getting a small strategic tidbit (upcoming twist hint).  
- Strategic players: quietly assess the situation.

**Surveillance Playback Beats (2–3)**  
Chris pulls up footage from `gs._castawaysCamera`. Picks 2–3 flagged events.  
- For each: a "PLAYBACK" beat where Chris narrates the footage.  
- The subject of the footage reacts: embarrassment (if it was their worst moment), pride (if it was their best), fury (if it was a private moment).  
- Mr. Coconut breakdown always plays back if it fired ("And THIS is why we do this show.").

**The Reveal**  
Chris admits he engineered the flood. Not apologetic.  
- High-intuition players knew: +0.5 ("CALLED IT" for real).  
- Players who believed it was real: anger reaction, −0.3 from the deflation.  
- Comedy: Chef admits he canceled arts & crafts because he was enjoying the peace.

**Confrontation Scoring Bonus**  
Players who performed consistently across Phases 1–3 (score ≥ 5.0 by Phase 4) get +1.0 "Endurance Bonus" as Chris grudgingly acknowledges their performance.

---

## Popularity System

Every phase has popularity-affecting moments:
- Wildlife brave moment: +2
- Mental breakdown (Mr. Coconut): −1
- Called-It vindication: +1
- Getting lost: −1
- Leading the charge at camp: +1
- Emotional reunion (someone cries, people find it touching): +1
- Embarrassing playback footage: −1
- Fighting back at Chris: +1

Pattern: `if (!gs.popularity) gs.popularity = {}; gs.popularity[name] = (gs.popularity[name] || 0) + delta;`

---

## Heat System

Temporary heat key: `gs._castawaysHeat` — `{ target, amount, expiresEp }` — fires when:
- Schemer manipulation detected in isolation (+heat on schemer)
- Surveillance playback reveals a strategic secret (+heat on exposed player)
- Someone's breakdown makes them look unstable (+0.3 heat, 1 episode)

---

## Camp Events (post-challenge, 3–4 per player group)

Feeds into `ep.campEvents[mergeName].post` (post-merge, so `gs.mergeName || 'merge'`).

- **SURVIVOR**: top scorer — bond bonus with all active players, +2 popularity
- **THE BREAKDOWN**: Mr. Coconut player — gentle/comic recap, bond reactions from players who witnessed
- **THE CALLED-IT**: highest intuition player who survived well — +1 popularity
- **THE DISASTER**: lowest scorer — brief consequence, soft targeting flag
- **UNEXPECTED BOND**: the pair with the biggest bond gain from the episode — they're now closer than anyone expected

---

## VP Architecture (Three-Mode)

### Mode 1: Surveillance
CSS class: `vp-castaways-surveillance`  
- Background: dark grey / near-black  
- Overlay: scanline filter (repeating linear-gradient, semi-transparent)  
- Camera ID watermark: top-left, monospace, dim green (`CAM-03 / ISLAND EAST` etc.)  
- Timestamp: top-right, ticking seconds (CSS animation on the seconds digit)  
- Night-vision tint: Phase 0 = full green tint; Phase 4 = normal color (daytime footage)  
- Event reveal: events "come in" as if footage is being reviewed — slide in from left with slight horizontal glitch  
- Chris commentary floats in as a VHS label strip from the bottom: white text on black bar, all-caps

### Mode 2: Castaway Diary  
CSS class: `vp-castaways-diary`  
- Background: aged paper (#f5e6c8 or similar warm cream)  
- Texture: subtle noise overlay  
- Event panels: bordered with ink-style border, slightly rotated (±1–2deg random per panel)  
- Badges: ink-stamp style — red circle, bold, slightly imperfect rotation  
- Font: serif or slab-serif for body, monospace for badges  
- Event reveal: panel "drops" in with a slight rotation settle (CSS transform + transition)  
- Phase headers: handwritten-style label at top of section

### Mode 3: Emergency Broadcast  
CSS class: `vp-castaways-broadcast`  
- Background: dark navy  
- Signal bar: top of screen, animated static pulse  
- Ticker: scrolling text at bottom (player names + score deltas)  
- Event text: clean, urgent, monospace  
- Vote reveals: each vote appears on a static-filled "transmission" card  
- Mr. Coconut elimination card (if non-elimination twist): SIGNAL LOST → OBJECT IDENTIFIED → ELIMINATED — styled as a corrupted transmission  

### Mode Transitions  
Between modes: 3-frame glitch flash (brief white frame → horizontal tear frame → new mode).  
Implemented as a CSS class swap with a 200ms transition state class that shows the glitch frames.

### VP Screens

| # | Screen | Mode | Notes |
|---|---|---|---|
| 1 | Flood Cold Open | Surveillance | Player reaction beats, click-to-reveal per player, ticking clock |
| 2 | Scattered — Group A | Diary | One panel per event, ink-stamp badges |
| 3 | Scattered — Group B | Diary | Same structure |
| 4 | Scattered — Group C | Diary | If 3 groups exist |
| 5 | The Night | Diary + Surveillance interrupts | Diary base; Chris commentary pops in as surveillance overlays |
| 6 | Regrouping | Diary → Surveillance blend | Diary panels with surveillance flash for Chris reactions |
| 7 | Storming the Camp | Surveillance | Full monitor grid (3×2), PLAYBACK label on callbacks |
| 8 | Immunity Results | Broadcast | Score leaderboard with signal-strength bars per player |
| 9 | Tribal Ceremony | Broadcast | Standard vote reveal + optional Mr. Coconut elimination card |

`_tvState` keys: `castawaysColdOpen`, `castawaysGroupA`, `castawaysGroupB`, `castawaysGroupC`, `castawaysNight`, `castawaysRegroup`, `castawaysStorm`, `castawaysImmunity`, `castawaysTribal`  
Each: `{ idx: -1 }` pattern, click-to-reveal per event.

---

## Text Backlog

`_textCampCastaways(ep, gs)` — generates a 3–4 paragraph summary covering:
1. The flood and initial chaos
2. The best survival/social moment per notable player
3. The Mr. Coconut breakdown (if fired)
4. The camp discovery confrontation
5. Immunity result + who's nervous heading to tribal

Located in `js/text-backlog.js` alongside other challenge summaries.

---

## Episode Integration

```
ep.challengeType = 'individual'
ep.challengeLabel = 'Camp Castaways'
ep.challengeCategory = 'survival'
ep.challengeDesc = 'Survive the night on a deserted island. Best survivor wins immunity.'
ep.isCampCastaways = true
ep.castawaysGroups = [...] // the random groups for VP reference
ep.castawaysBreakdowns = [...] // { player, object, objectName } per breakdown fired
ep.chalMemberScores = { ...personalScores }
```

Immunity winner: `ep.immunePlayer = topScorer`  
Tribal players: all non-immune active players.

`updateChalRecord(ep)` called with `ep.chalMemberScores` as normal.  
Add `'camp-castaways'` to the skip list for main `updateChalRecord` if it conflicts.

---

## Challenge Registration

In `js/challenges-core.js`:
- Add `'camp-castaways'` to the post-merge individual challenge pool
- `pickChallenge` dispatch: `import { simulateCampCastaways } from './chal/camp-castaways.js'`
- Add to twist catalog in `js/run-ui.js`
- Add label/description to `ep.challengeLabel` display map

---

## Anti-Repetition Design

Event pools are large (5–10 texts per event type). Hash-based deterministic selection (`_hash(player + eventType, pool.length)`) ensures the same player doesn't always get the same text while keeping it deterministic per run. Wildlife pool has 9 distinct animal types — max 2 per group, no repeats within a group. Night events have separate comedy / drama / heartfelt / romance buckets — at most 1 from each bucket per group. Phase 4 playback callbacks always reference actual events that fired in Phases 1–2, so every storming-the-camp sequence is unique to the run.

---

## Files

- `js/chal/camp-castaways.js` — main challenge file (simulate + rpBuild* + _text*)
- No new support files needed; all patterns follow existing challenge architecture
