# Hell's Kitchen Design

**Date:** 2026-04-11
**Inspired by:** Total Drama Island S1E10 "If You Can't Take the Heat..."
**Type:** Schedulable challenge twist (pre-merge, tribe vs tribe)

---

## Overview

Cooking challenge. Each tribe selects a head chef (leadership formula), assigns pairs to 3 courses (appetizer, main, dessert), and cooks under pressure. Kitchen chaos — fires, sabotage, food fights, fridge lockdowns, ingredient disasters — interleaves with cooking. Host judges each course 1-10. Highest total wins immunity. Deep consequences: chef tyranny creates tribal heat, food fights spark romance, sabotage creates lasting reputation damage.

## TWIST_CATALOG Entry

```
id: 'hells-kitchen'
emoji: '🔥'
name: "Hell's Kitchen"
category: 'challenge'
phase: 'pre-merge'
engineType: 'hells-kitchen'
minTribes: 2
incompatible: [all other challenge twists]
```

---

## Head Chef Selection

**Leadership formula** (proportional, no thresholds):

```
leadershipScore = strategic * 0.04 + social * 0.03 + boldness * 0.03 + random(0, 0.15)
```

Highest score on each tribe becomes head chef. Stored: `ep.hellsKitchen.chefs[tribeName] = { name, score, style }`

**Chef style** (derived from archetype, affects events):

| Archetype | Style | Effect |
|---|---|---|
| Villain / schemer | Tyrant | Efficient (+0.08 all courses) but bond -0.3 with team. Rebellion risk. |
| Hero / loyal-soldier | Motivator | Bond +0.2 with team, +0.05 all courses |
| Mastermind | Delegator | Optimal pair assignments (matches stats to courses) |
| Social-butterfly / showmancer | Hype chef | Morale boost, group events more likely |
| Chaos-agent / hothead | Chaos chef | Unpredictable — could be amazing or disastrous. ±0.1 random per course |
| Wildcard | Improviser | Unique dishes unlocked, higher variance |
| Default | Standard | No special modifier |

---

## Course Structure

**3 courses:** Appetizer → Main → Dessert. Sequential (events can fire between/during courses).

### Pair Assignment

Chef assigns pairs to courses. Assignment is stat-driven:

- **Appetizer** (presentation-focused): prioritize mental + intuition
- **Main** (execution-focused): prioritize physical + endurance
- **Dessert** (precision + flair): prioritize mental + intuition, highest variance

Chef assigns based on their style:
- **Delegator**: optimal stat matching
- **Tyrant**: assigns favorites to easy courses, enemies to hard ones
- **Default**: semi-random with slight stat preference

If tribe has odd members, one player assists across courses (floater role — lower score contribution but more event opportunities).

### Course Scoring

```
baseCookScore = (cookA.intuition * 0.04 + cookB.mental * 0.04 
                + (cookA.social + cookB.social) * 0.01 
                + random(0, 0.2))
```

**Modifiers:**
- Chef delegation bonus: +0.05 to +0.10 (style-dependent)
- Pair bond ≥ 2: +0.03 per bond point above 2
- Pair bond < 0: -0.04 per point below 0
- Event modifiers: disasters (-0.1 to -0.3), saves (+0.1 to +0.15), sabotage (-0.15 to -0.25)

**Score → Host Rating (1-10):**

| Range | Rating | Host Reaction |
|---|---|---|
| < 0.20 | 1-2 | Disaster — spits it out, gags |
| 0.20-0.35 | 3-4 | Bad — grimaces, pushes plate away |
| 0.35-0.50 | 5-6 | Mediocre — shrugs, "I've had worse" |
| 0.50-0.65 | 7-8 | Good — nods, finishes the plate |
| 0.65-0.80 | 9 | Excellent — "Now THAT'S cooking" |
| > 0.80 | 10 | Chef's kiss — rare, standing ovation |

---

## Dish Pool (randomized per game)

Each tribe gets a random dish per course from these pools. Dish name appears in VP.

### Appetizer Pool (15+ options)

| Dish | Flavor Text |
|---|---|
| Bruschetta | Toasted bread, fresh tomatoes, basil. Simple but easy to mess up. |
| Shrimp Cocktail | Chilled shrimp with cocktail sauce. Timing is everything. |
| Caesar Salad | Romaine, croutons, parmesan. The dressing makes or breaks it. |
| Spring Rolls | Rice paper, vegetables, dipping sauce. Delicate work. |
| Caprese Skewers | Mozzarella, tomato, basil on sticks. Presentation matters. |
| Stuffed Mushrooms | Mushroom caps with herbed filling. Oven timing critical. |
| Soup du Jour | Chef's choice soup. Wide variance — could be brilliant or terrible. |
| Charcuterie Board | Cured meats, cheeses, crackers. Assembly art. |
| Deviled Eggs | Classic but judged harshly if bland. Spice game matters. |
| Ceviche | Raw fish cured in citrus. Bold choice. High risk, high reward. |
| French Onion Soup | Caramelized onions, gruyère, crusty bread. Takes patience. |
| Crab Cakes | Pan-seared crab patties. Expensive ingredients, pressure not to waste them. |
| Tartare | Raw beef, capers, egg yolk. Intimidating. Judges love it or hate it. |
| Gyoza | Pan-fried dumplings. Folding technique separates good from great. |
| Antipasto Platter | Italian meats, olives, roasted peppers. The classic. |

### Main Course Pool (15+ options)

| Dish | Flavor Text |
|---|---|
| Spaghetti Bolognese | Pasta with meat sauce. Comfort food. Hard to make memorable. |
| Grilled Salmon | Cedar-planked salmon with lemon. Don't overcook it. |
| Beef Wellington | Tenderloin in puff pastry. The ultimate test — soggy bottom = death. |
| Chicken Parmesan | Breaded chicken, marinara, mozzarella. Crowd pleaser. |
| Lamb Chops | Herb-crusted, pan-seared. Temperature is everything. |
| Stir-Fry | Wok-fired vegetables and protein. Speed cooking. |
| Risotto | Arborio rice, constant stirring. Patience challenge. |
| BBQ Ribs | Slow-cooked, sauce-glazed. Time-intensive but impressive. |
| Fish Tacos | Grilled fish, slaw, lime crema. Fresh and fast. |
| Pad Thai | Rice noodles, tamarind sauce, peanuts. Balance of flavors. |
| Roast Chicken | Whole bird, roasted vegetables. Simple but the host judges harshly. |
| Lasagna | Layered pasta, meat sauce, béchamel. Architecture matters. |
| Surf & Turf | Steak and lobster tail. Luxury dish, two things to cook perfectly. |
| Curry | Spiced stew with rice. Flavor depth is the test. |
| Pork Tenderloin | Herb-rubbed, pan-seared, oven-finished. Resting time matters. |

### Dessert Pool (15+ options)

| Dish | Flavor Text |
|---|---|
| Crème Brûlée | Custard with caramelized sugar top. Torch required — fire risk. |
| Chocolate Lava Cake | Molten center, timing critical. 30 seconds too long = solid disappointment. |
| Flambé Bananas Foster | Bananas in rum sauce, lit on fire. The Lindsay moment — could explode. |
| Tiramisu | Layers of mascarpone, espresso-soaked ladyfingers. No-bake but complex. |
| Apple Pie | Classic. Lattice crust separates amateurs from pros. |
| Cheesecake | New York style. Dense, creamy, needs time to set. |
| Panna Cotta | Italian custard with berry coulis. Wobble factor — did it set? |
| Soufflé | Risen egg dish. Collapses if you look at it wrong. Highest variance dessert. |
| Tarte Tatin | Upside-down apple tart. The flip is the moment of truth. |
| Profiteroles | Choux pastry puffs with chocolate. Assembly line work. |
| Macarons | French almond cookies. Notoriously difficult. Bragging rights if pulled off. |
| Brownies | Easy to make, hard to make special. The host expects more. |
| Fruit Tart | Pastry cream, fresh fruit, glaze. Presentation is 80% of the score. |
| Baked Alaska | Ice cream inside meringue, torched. Another fire risk. |
| Churros | Fried dough, chocolate sauce. Fun but is it "fine dining"? |
| Éclairs | Choux pastry, cream filled, chocolate topped. Piping technique matters. |

---

## Event Pool (~45 types)

Events fire between and during courses. 4-7 per round (1 round = 1 course). Interleaved in timeline like paintball.

### Kitchen Disasters (accidents — stat-proportional)

| Event | Trigger | Score Impact | Deep Consequence |
|---|---|---|---|
| Flambé explosion | dessert course + (10-mental) * 0.02 | -0.2 course | Comedy + injury system. Burned player loses eyebrows (cosmetic badge). If they have a showmance, partner's reaction is its own event. |
| Food gobbler | physical * 0.03 + (10-mental) * 0.02 | -0.15 to -0.3 (how much eaten) | Gobbler chooses: confess or hide. Confess → -bond but lower heat. Hide → if dish scores low, team figures it out next episode → trust crack + heat spike. |
| Ingredient drop | (10-physical) * 0.02 | -0.1 course | Dropped on teammate → injury. Dropped ingredient → have to improvise with what's left. Improvisation check (intuition proportional) can actually improve the dish. |
| Kitchen fire | (10-mental) * 0.015 | -0.15 to -0.25 | Team scrambles. Rally event can fire after — bond boost from shared crisis. If fire destroys the dish, team must restart with time penalty. |
| Allergic reaction | random 5% per player | player sits out | Player can't cook rest of challenge. Creates sympathy bond (+0.2 from teammates). Remaining partner does course solo (score halved but personal score boosted if they pull it off). |
| Knife slip | (10-physical) * 0.01 | -0.05 | Minor injury → `gs.lingeringInjuries`. Player cooks through it (endurance check) or sits out. Cooking through it = heroic, +popularity. |
| Spill disaster | (10-endurance) * 0.015 + random | -0.15 course (halved) | Happens during serving. The dish looked great, tasted great, and is now on the floor. Comedy + devastation. Team reacts by archetype — villain blames, hero comforts, chaos-agent laughs. |
| Oven malfunction | random 8% | -0.1 | One team's oven breaks. They have to share with the other team or cook on stovetop only. Sharing = forced cross-team interaction. |
| Raw food scare | (10-intuition) * 0.015 | -0.2 | Host finds undercooked protein. Disgust reaction. If the chef delegated this pair, chef gets blame heat. |
| Wrong recipe | (10-mental) * 0.01 | -0.15 | Player misreads ingredients. Salt instead of sugar. The dish is unsalvageable. |

### Leadership Drama (chef-driven)

| Event | Trigger | Score Impact | Deep Consequence |
|---|---|---|---|
| Tyrannical chef | villain/schemer chef | +0.08 all courses | Bond -0.3 with each teammate. Creates `gs._cookingHeat` on chef. If team WINS → heat halved (results justify it). If team LOSES → heat doubles. Teammates reference at tribal: "you treated us like servants." |
| Chef rebellion (fridge lock) | tyrant chef + any teammate bond ≤ 0 with chef | chef misses 1 course | Rebels bond +0.4 with each other. Locked chef: if team wins anyway → rebels are heroes. If team loses → rebels get heat ("you cost us the game"). Chef gets sympathy popularity if they were right about the cooking. |
| Chef meltdown | (10-temperament) * 0.02 on chef | -0.1 all remaining courses | Chef cracks. Team sees weakness. Bond shift depends on archetype: loyal players comfort (+bond), schemers exploit (alliance pitch opportunity). |
| Motivational chef | hero/loyal chef | +0.05 all courses | Bond +0.2 with team. Players work harder. If team wins, chef gets +3 popularity. The Geoff moment. |
| Chef plays favorites | chef bond differential ≥ 3 between teammates | varies | Favored player gets easy course. Unfavored gets hard course. Creates 3-way dynamic: chef-favorite (+bond), chef-unfavored (-bond), favorite feels guilt (loyalty proportional). |
| Micromanager | strategic ≥ 7, social ≤ 4 on chef | +0.05 courses but bond -0.2 | Efficient but annoying. Every player's work gets criticized. Players with high boldness push back → mini food fight. |
| Chef delegation | mastermind chef or strategic ≥ 7 | +0.1 all courses | Perfect stat matching. Each player feels utilized. Bond +0.1. The opposite of tyranny — leads to "they actually knew what they were doing" camp event. |
| Quiet leader | chef with social ≤ 4 but high mental | +0.03 courses | Leads by doing, not talking. No bond boost or damage. Under the radar — but if team wins, retrospective appreciation camp event. |
| Chef ego | boldness ≥ 7 on chef | ±0.1 (random) | Chef insists on doing a course themselves. Could be amazing (they're actually good) or terrible (they bottleneck everything). Other players idle → resentful if it fails, impressed if it works. |
| Chef showdown | both team chefs, boldness proportional | winner +0.05 morale | Chefs trash-talk each other before cooking starts. Boldness + social determines who wins the exchange. Winning chef's team gets morale boost, losing chef's team gets doubt. |

### Cooking Drama (interpersonal — bond-driven)

| Event | Trigger | Score Impact | Deep Consequence |
|---|---|---|---|
| Food fight | pair bond ≤ 0, boldness proportional | -0.1 course | Two players argue over the dish, food gets thrown. Bond -0.5. BUT if romantically compatible + bond ≥ 2 → it's flirting. Creates romance spark via `_challengeRomanceSpark`. The Duncan/Courtney custard moment. |
| Taste war | two players, both intuition ≥ 5 | winner's version served | Two cooks disagree on seasoning. Higher intuition player's version gets used. Loser's reaction by archetype — villain holds grudge, hero accepts gracefully. |
| Chopping competition | two players same course, physical proportional | winner +0.05 | Spontaneous speed contest. Fun moment, bond +0.2 between competitors. Loser takes it well or doesn't (temperament proportional). |
| Dish stealing | schemer/villain, bond ≤ 1 with partner | thief +1.0 personal, victim -1.0 | One player claims credit for the other's work in front of the host. Victim finds out → bond crash -1.5. Creates lasting "credit thief" reputation. Camp event: confrontation. |
| Comfort cooking | homesick player (random 10%) | +0.05 if emotional | Player cooks something from home instead of the assigned dish. Risky (might not fit the course) but if it works → emotional moment, bond +0.3 with whoever tastes it. |
| Too many cooks | 3+ players on one course | -0.1 neglected course | Everyone clusters around the main, appetizer gets neglected. Chef's fault for not managing. Score imbalance. |
| Presentation disaster | (10-mental) * 0.01 | -0.08 | Food tastes fine but looks terrible. The host judges with eyes first. "It looks like someone sat on it." |
| Copycat accusation | cross-tribe, random 8% | no score impact | One team accuses the other of stealing their dish idea. Drama, no real impact but bond -0.3 cross-tribe. Creates rivalry narrative. |

### Positive Kitchen Events

| Event | Trigger | Score Impact | Deep Consequence |
|---|---|---|---|
| Perfect pairing | pair bond ≥ 4 | +0.1 course | Two friends cook in perfect sync. Bond +0.3. If showmance pair → romantic cooking moment (flour on face, hands touching). |
| Natural talent | intuition ≥ 7, random 15% | +0.1 course, +1.5 personal | Player discovers they're actually a great cook. Surprise for everyone. +2 popularity. Camp event: "Who knew [name] could cook?" |
| Plating artist | mental ≥ 7 | +0.05 course | Dish looks stunning. Presentation bonus. The host eats with their eyes first. |
| Team rally | fires after a disaster event | recovers +0.05 of lost score | Team comes together after a crisis. Bond boost specifically between players who were neutral/slightly negative — creates NEW connections from shared adversity. Strong existing bonds unaffected. |
| Taste tester hero | intuition * 0.03 | saves -0.1 penalty | Player catches a problem (too salty, undercooked) before serving. Saves the course. +1.5 personal score. The unsung hero. |
| Sous chef clutch | non-chef player, after chef meltdown/lock | +0.1 course | Steps up when chef is gone. Personal score +1.5, +2 popularity. Creates "real leader" narrative for tribal politics. |
| Crowd pleaser | intuition ≥ 6 + boldness ≥ 5, random 12% | +0.08 course | Adds a creative twist the host loves. Risky move that paid off. |
| Kitchen dance | pair bond ≥ 3, social proportional | +0.03 course | Two players vibe while cooking. Music, movement, fun. Bond +0.3. Pure joy moment. |
| Mentor moment | one player mental ≥ 7, partner mental ≤ 4 | +0.05 course | Experienced player teaches the clueless one. Bond +0.4. The taught player's future cooking events get a small bonus. |
| Secret family recipe | random 8% per player | ±0.1 (risky) | Player goes off-script with a family recipe. Could be amazing (intuition check) or terrible. If it works → emotional moment + score boost. If it fails → "should've stuck to the plan." |
| Garnish save | mental * 0.02 | +0.05 course | Mediocre dish saved by last-second presentation magic. Sauce drizzle, herb garnish, artistic plating. |
| Efficient prep | endurance ≥ 6 | +0.03 (time saved) | Player preps twice as fast, giving team breathing room. Others can help with struggling courses. |
| Encouragement | social ≥ 6, partner struggling | +0.05 partner's score | Player hypes up a struggling teammate. Bond +0.2. The struggling player's score improves slightly. |
| Flavor breakthrough | intuition * 0.025, random | +0.08 course | Player experiments and discovers an amazing combination. "Wait... taste this." Everyone stops. It's incredible. |
| Underdog cook | player with lowest mental on tribe | +0.1 if scored 7+ | Player everyone expected to fail actually delivers. +3 popularity. The feel-good moment. |
| Teamwork montage | all 3 courses scored 5+, random 20% | +0.05 each course | Whole team hits a groove. Montage energy. Group bond boost +0.2 across all pairs. |
| Clean station | endurance ≥ 5, mental ≥ 5 | prevents 1 disaster | Organized player keeps the kitchen running smoothly. One random disaster that would have fired gets prevented. Unsung hero — nobody notices. |

### Cross-Team Events (rare, archetype-gated)

| Event | Trigger | Score Impact | Deep Consequence |
|---|---|---|---|
| Ingredient theft | schemer/villain, strategic * 0.02 | -0.1 victim team, +0.05 thief team | Sneaks into opposing kitchen, steals key ingredient. If caught (intuition check by victim team) → huge bond damage + heat. If not caught → victim team has to improvise. Thief's own team reaction depends on archetype — villains approve, heroes are disgusted. |
| Spice bomb | chaos-agent, boldness * 0.015 | -0.15 victim course | Dumps hot sauce/excess salt into opposing dish. If caught → ejected from own kitchen for a course (sits out). Bond crash with own team ("you made us look bad"). |
| Distraction play | mastermind/schemer, strategic * 0.02 | -0.05 victim course | Sends someone to chat up opposing chef, wasting their time. Subtle. If the distractor has high social, the opposing chef doesn't even realize they're being played. |
| Kitchen spy | strategic ≥ 6, random 10% | no score impact | Peeks at what the other team is cooking. Intel advantage — can adjust their dish to be different. Small strategic bonus. |
| Trash talk | both teams, boldness proportional | winner team +0.03 morale | Teams taunt each other through the wall. Bond -0.2 cross-tribe but +0.2 within tribe (us vs them solidarity). |

### Showmance Moments (romance guard — seasonConfig.romance !== 'disabled')

| Event | Trigger | Score Impact | Deep Consequence |
|---|---|---|---|
| Cooking together spark | paired players, romantically compatible, bond ≥ 3 | +0.03 | Flour on face moment, hands touching over ingredients. Creates spark via `_challengeRomanceSpark`. |
| Food fight flirt | food fight between compatible pair, bond ≥ 2 | -0.05 course, +0.5 bond | The fight IS the flirting. Custard in hair. They're not fighting, they're falling. Romance spark. |
| Protective instinct | showmance pair, one gets hurt (knife slip, fire) | partner -0.5 score | Partner rushes to help, abandons their course. Bond +0.5. `_checkShowmanceChalMoment` with 'danger'. |

---

## Personal Scoring

| Action | Score |
|---|---|
| Course scored 8+ (both cookers) | +2.0 |
| Course scored 5-7 | +1.0 |
| Course scored 1-4 | -0.5 |
| Head chef (winning team) | +2.5 |
| Head chef (losing team) | -1.5 |
| Clutch save / taste tester hero | +1.5 |
| Natural talent / underdog cook | +1.5 |
| Caused disaster (fire, spill, ate food) | -2.0 |
| Got locked in fridge | -1.0 |
| Successful sabotage (not caught) | +1.0 but +heat |
| Sabotage caught | -2.0 + heat + bond crash |
| Food fight participant | -0.5 |
| Perfect pairing bonus | +0.5 |
| Sous chef clutch | +1.5 |
| Mentor moment (teacher) | +0.5 |
| Per course floater assisted | +0.3 |

---

## Winner Determination

Highest total host rating across 3 courses wins immunity.
- **3+ tribes:** Lowest total = loser → tribal. Others safe.
- **2 tribes:** Lowest total = loser.
- **Tiebreak:** Dessert score (finale course). If still tied: appetizer score.
- **MVP:** Highest personal score on winning team. +2 popularity.

---

## Heat Integration

`gs._cookingHeat` — same `{ amount, expiresEp }` pattern.

| Source | Heat | Duration |
|---|---|---|
| Tyrant chef (team lost) | +2.0 | 2 episodes |
| Tyrant chef (team won) | +0.5 | 1 episode |
| Saboteur (caught) | +2.5 | 3 episodes |
| Food gobbler (hid it) | +1.5 | 2 episodes |
| Fridge lock rebels (team lost) | +1.0 | 1 episode |
| Disaster culprit | +1.0 | 1 episode |

---

## VP Screen — Overdrive

### Theme
Kitchen aesthetic — warm orange/red tones, stainless steel accents, steam/heat effects.

**Background:** `linear-gradient(180deg, #1a0a0a 0%, #0d1117 50%, #0d1117 100%)`

### CSS Animations

```css
@keyframes flamePulse {
  0%, 100% { text-shadow: 0 0 10px rgba(255,100,0,0.3); }
  50% { text-shadow: 0 0 20px rgba(255,100,0,0.6), 0 0 40px rgba(255,50,0,0.2); }
}
@keyframes steamRise {
  0% { opacity: 0.6; transform: translateY(0) scaleX(1); }
  100% { opacity: 0; transform: translateY(-30px) scaleX(1.5); }
}
@keyframes scoreReveal {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes plateSlide {
  0% { transform: translateX(-30px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
```

### Page Structure

1. **Header** — "HELL'S KITCHEN" in fiery orange with `flamePulse` animation. Tribe matchup below.

2. **Chef Selection Cards** — per tribe, spotlight card with chef portrait, apron emoji, leadership score bar, archetype-flavored intro text. Gold border for winning chef.

3. **Course Assignment** — compact grid per tribe showing who's cooking what. Dish names visible.

4. **Timeline** (click-to-reveal, interleaved):
   - **Kitchen event cards** — color-coded border:
     - Green = positive (talent, teamwork, saves)
     - Red = disaster (fire, spill, raw food)
     - Orange = drama (food fight, taste war, rebellion)
     - Purple = sabotage (theft, spice bomb)
     - Pink = romance (cooking spark, food fight flirt)
   - **Course result cards** — the big reveal:
     - Dish name + description
     - `plateSlide` animation for the dish
     - Steam effect above the plate (CSS `steamRise`)
     - Host reaction text
     - Score with `scoreReveal` animation (number appears dramatically)
     - Color: green (7+), yellow (4-6), red (1-3)

5. **Final Scoreboard** — side-by-side tribe columns:
   - Course scores stacked (appetizer/main/dessert)
   - Total in large font
   - Winner announcement with celebration
   - Loser with "tribal council" stamp

6. **MVP card** — gold spotlight, chef hat emoji

### Course Result Card Detail

```
┌─────────────────────────────────┐
│ 🍽️ APPETIZER                    │
│ ┌─────────────┐ ┌─────────────┐ │
│ │  [Portrait] │ │  [Portrait] │ │
│ │   Cook A    │ │   Cook B    │ │
│ └─────────────┘ └─────────────┘ │
│                                 │
│ ═══ Bruschetta ═══              │
│ "Toasted bread, fresh tomatoes, │
│  basil. Crusty, aromatic."      │
│         ~~~steam~~~             │
│                                 │
│    ┌─────────┐                  │
│    │    7    │  ← scoreReveal   │
│    └─────────┘                  │
│ "Chef nods. Not bad. Not bad    │
│  at all."                       │
└─────────────────────────────────┘
```

---

## Host Reaction Text Pool (per score range)

### Score 1-2 (Disaster)
- "[Host] takes one bite and immediately spits it into a napkin."
- "[Host] stares at the plate for a long time. Then pushes it away without a word."
- "[Host] gags. Actually gags. The kitchen goes silent."
- "'What... is this?' [Host] asks. Nobody answers."
- "[Host] takes the plate and dumps it directly in the trash."

### Score 3-4 (Bad)
- "[Host] grimaces. 'I've had better from a vending machine.'"
- "[Host] finishes the bite but clearly wishes they hadn't."
- "'It's... food. Technically,' [Host] says."
- "[Host] takes two bites and sets down the fork. That's all they need."

### Score 5-6 (Mediocre)
- "[Host] shrugs. 'It's fine. Just... fine.'"
- "'Not bad, not great. Middle of the road,' [Host] says."
- "[Host] eats it without complaint, which might be the worst review of all."
- "'I've had worse. I've also had much better.'"

### Score 7-8 (Good)
- "[Host] nods approvingly. 'Now you're cooking.'"
- "'Okay, I see you,' [Host] says with a half-smile."
- "[Host] finishes the entire plate. That says everything."
- "'This is solid. Real solid,' [Host] says, reaching for more."

### Score 9 (Excellent)
- "[Host] stops mid-bite. Closes their eyes. 'Yeah. That's the one.'"
- "'Where has THIS been all season?' [Host] says."
- "[Host] actually applauds. The tribe doesn't know how to react."

### Score 10 (Chef's Kiss)
- "[Host] stands up. Slow clap. 'That is restaurant-quality.'"
- "'I would pay money for this,' [Host] says. Nobody has ever heard that before."
- "[Host] kisses their fingers. Chef's kiss. The tribe erupts."

---

## Camp Events (2 positive + 1-2 negative per tribe)

**Positive:**
- MVP Chef (highest personal score, winning team)
- Sous Chef Hero (stepped up when chef was down)
- Underdog Cook (lowest-stat player who scored well)
- Kitchen Couple (food fight → romance spark)

**Negative:**
- Kitchen Disaster culprit (caused fire/spill)
- Fridge Lock drama (victim or rebels, depending on outcome)
- Saboteur Exposed (caught stealing/spice bombing)
- Food Gobbler Shame (ate the team's food)
- Tyrant Chef backlash (if team lost)

---

## Episode History

```
ep.isHellsKitchen = true
ep.hellsKitchen = {
  chefs,           // { tribeName: { name, score, style } }
  assignments,     // { tribeName: { appetizer: [a,b], main: [a,b], dessert: [a,b], floater? } }
  dishes,          // { tribeName: { appetizer: dishName, main: dishName, dessert: dishName } }
  courseScores,     // { tribeName: { appetizer: {raw, rating, hostReaction}, main: {...}, dessert: {...} } }
  timeline,        // interleaved events (stored at sim time, stable)
  events,          // all events array
  fridgeLock,      // { victim, rebels: [], round } or null
  sabotage,        // [{ type, perpetrator, target, caught }]
  foodFights,      // [{ players: [a,b], romantic }]
  winner, loser, mvp
}
```

---

## Text Backlog

`_textHellsKitchen(ep, ln, sec)` — chef selection, course assignments, dishes, per-course events + scores, final result.

## Cold Open Recap

Winner, MVP, fridge lock if any, sabotage if any, food fight romance if any.

## Timeline Tag

`hkTag` — "Hell's Kitchen" in orange-red (#f97316).

## Debug Challenge Tab

Chef selection scores, pair assignments, per-course raw scores + modifiers, event log, personal score breakdown.

---

## Edge Cases

- **3+ tribes:** Each tribe cooks independently. Lowest total = loser. Others safe.
- **Small tribe (3 members):** Chef + 1 pair + floater. Floater assists all courses.
- **2-member tribe:** One becomes chef AND cooks. No pair bonus. Disadvantage but every point is personal — podium easier.
- **Fridge lock + team wins:** Rebels are heroes. Locked chef gets sympathy.
- **Fridge lock + team loses:** Rebels take heat. "You cost us the game."
- **All courses score 1-2:** Team total is very low. Comedy episode. Camp event: group shame.
- **Balanced scoring:** chef and non-chef roles should avg ~3.0-4.0 personal score. Neither role dominates podium.
