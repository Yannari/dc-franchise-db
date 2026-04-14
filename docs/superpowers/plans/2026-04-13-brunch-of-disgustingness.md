# Brunch of Disgustingness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a merge-episode eating challenge twist: boys vs girls split, cabin dynamics, 9-course gross food eating with refusals/chain vomit/cross-team moments, eat-off tiebreaker, themed VP with overdrive effects.

**Architecture:** Add twist catalog entry + applyTwist handler that sets up boys/girls teams. New `simulateBrunchOfDisgustingness(ep)` function handles cabin dynamics → 9-course eating → eat-off → scoring → camp events. 4 VP screens with gross-out game show theme. Full integration (text backlog, cold open, timeline, camp boosts, episode history).

**Tech Stack:** Vanilla JS, single file (`simulator.html`)

**Spec:** `docs/superpowers/specs/2026-04-13-brunch-of-disgustingness-design.md`

---

## Note on task size

This is a large feature. Each task below may take longer than typical tasks. The food pools and reaction text pools alone are substantial. The engineer should read the spec alongside this plan for full context on the design intent.

All line numbers are approximate — they shift as earlier tasks add code. Always search for the exact string patterns before editing.

---

### Task 1: Food pools + reaction text data

**Files:**
- Modify: `simulator.html` — insert after Say Uncle dare pools (search for `SAY_UNCLE_CATEGORIES`)

Add the food pool and all reaction text pools as module-level constants. These are pure data — no logic.

- [ ] **Step 1: Add the food pool**

Find `SAY_UNCLE_CATEGORIES = Object.keys(SAY_UNCLE_POOL)` (around line 2472). Insert after it:

```javascript
// ══════════════════════════════════════════════════════════════════════
// BRUNCH OF DISGUSTINGNESS — FOOD & REACTION POOLS
// ══════════════════════════════════════════════════════════════════════
const BRUNCH_FOOD_POOL = {
  'meat-gross': [
    { name: 'Bovine Testicles', desc: 'Bull parts. Rubbery. Chewy. Exactly what you think they are.', category: 'meat-gross' },
    { name: 'Mystery Meat Stew', desc: 'Nobody knows what animal this came from. Possibly several.', category: 'meat-gross' },
    { name: 'Pig Snout Pâté', desc: 'Snout, ground into paste. Smells like a barn on a hot day.', category: 'meat-gross' },
    { name: 'Tongue Tartare', desc: 'Raw cow tongue, diced. Still has taste buds on it.', category: 'meat-gross' },
    { name: 'Tripe Tacos', desc: 'Stomach lining in a tortilla. The texture is the problem.', category: 'meat-gross' },
    { name: 'Brain Fritters', desc: 'Deep-fried sheep brain. Creamy inside. Don\'t think about it.', category: 'meat-gross' },
    { name: 'Sweetbread Sliders', desc: 'Thymus gland on a mini bun. "Sweetbread" is a lie.', category: 'meat-gross' },
    { name: 'Head Cheese', desc: 'Not cheese. Jellied meat from a head. Every part of the head.', category: 'meat-gross' },
    { name: 'Blood Sausage', desc: 'Cooked blood in a casing. Dark red, almost black. Metallic taste.', category: 'meat-gross' },
    { name: 'Chicken Feet Soup', desc: 'Feet. In broth. The toenails are still on.', category: 'meat-gross' },
    { name: 'Haggis', desc: 'Sheep organs minced inside a stomach lining. A Scottish tradition.', category: 'meat-gross' },
    { name: 'Rocky Mountain Oysters', desc: 'Not oysters. Not from the ocean. From a bull.', category: 'meat-gross' },
    { name: 'Liver Smoothie', desc: 'Blended raw liver with a splash of beet juice. Iron-rich.', category: 'meat-gross' },
    { name: 'Oxtail Jelly', desc: 'Gelatinous oxtail in aspic. Wobbles on the plate.', category: 'meat-gross' },
    { name: 'Meat Mystery Loaf', desc: 'Chef won\'t say what\'s in it. The texture changes every bite.', category: 'meat-gross' },
  ],
  'bug-gross': [
    { name: 'Live Grasshopper Pizza', desc: 'Spicy jellyfish sauce, live anchovies, and grasshoppers that are still moving.', category: 'bug-gross' },
    { name: 'Cockroach Crumble', desc: 'Baked cockroaches with a brown sugar crust. Crunchy.', category: 'bug-gross' },
    { name: 'Beetle Bruschetta', desc: 'Toasted bread topped with sautéed beetles and garlic.', category: 'bug-gross' },
    { name: 'Cricket Casserole', desc: 'Hundreds of crickets baked in cream sauce. They crunch.', category: 'bug-gross' },
    { name: 'Mealworm Muffins', desc: 'Blueberry muffins but the blueberries are mealworms.', category: 'bug-gross' },
    { name: 'Ant Egg Omelette', desc: 'Fluffy omelette filled with ant eggs. They pop in your mouth.', category: 'bug-gross' },
    { name: 'Scorpion Skewers', desc: 'Skewered and deep-fried. The stinger is still attached.', category: 'bug-gross' },
    { name: 'Tarantula Tempura', desc: 'Battered and fried whole. The legs stick out of the batter.', category: 'bug-gross' },
    { name: 'Fly Larvae Risotto', desc: 'Creamy risotto. The rice has been replaced with maggots.', category: 'bug-gross' },
    { name: 'Centipede Ceviche', desc: 'Raw centipede marinated in lime. Still curling.', category: 'bug-gross' },
    { name: 'Wasp Crackers', desc: 'Rice crackers studded with whole wasps. Stingers removed. Probably.', category: 'bug-gross' },
    { name: 'Locust Loaf', desc: 'Ground locust bread. Dense, nutty, and deeply wrong.', category: 'bug-gross' },
    { name: 'Silk Worm Sushi', desc: 'Silk worm pupae on rice. They\'re boiled, not raw. Small comfort.', category: 'bug-gross' },
    { name: 'Grub Goulash', desc: 'Fat white grubs in paprika sauce. They burst when you bite down.', category: 'bug-gross' },
    { name: 'Mosquito Mousse', desc: 'Whipped chocolate mousse mixed with dried mosquitoes. Gritty.', category: 'bug-gross' },
  ],
  'texture-gross': [
    { name: 'Earthworms in Snail Slime', desc: 'Live earthworms coated in actual snail mucus. With hairball garnish.', category: 'texture-gross' },
    { name: 'Pre-Chewed Gum Platter', desc: 'Already chewed by Chef. Assorted flavours. All flat.', category: 'texture-gross' },
    { name: 'Hairball Pasta', desc: 'Spaghetti made from actual hair. In a slime sauce.', category: 'texture-gross' },
    { name: 'Slug Soufflé', desc: 'Whipped slug. Light, airy, and leaves a trail on the plate.', category: 'texture-gross' },
    { name: 'Mucus Meringue', desc: 'Meringue made with... not egg whites. Stringy.', category: 'texture-gross' },
    { name: 'Gelatin Eyeballs', desc: 'Gelatin moulded into eyeball shapes. They stare back.', category: 'texture-gross' },
    { name: 'Fish Scale Flakes', desc: 'Dried fish scales served like cereal. In warm milk.', category: 'texture-gross' },
    { name: 'Toenail Croutons', desc: 'Baked and seasoned toenail clippings on a salad.', category: 'texture-gross' },
    { name: 'Skin Pudding', desc: 'A pudding with the texture of skin. Because it is.', category: 'texture-gross' },
    { name: 'Blister Broth', desc: 'Broth made from boiled blisters. Salty. Warm. Wrong.', category: 'texture-gross' },
    { name: 'Earwax Caramel', desc: 'Caramel with the colour and consistency of earwax. Tastes similar.', category: 'texture-gross' },
    { name: 'Dandruff Dust Seasoning', desc: 'Your meal, seasoned with scalp flakes. Adds... crunch.', category: 'texture-gross' },
    { name: 'Scab Brittle', desc: 'Peanut brittle but the peanuts have been replaced with scabs.', category: 'texture-gross' },
    { name: 'Belly Button Lint Balls', desc: 'Rolled, compressed, and served on a stick. Fuzzy.', category: 'texture-gross' },
    { name: 'Pus Pastry', desc: 'Cream puff. The cream is not cream. It\'s from a boil.', category: 'texture-gross' },
  ],
  'mystery-gross': [
    { name: 'Painted Sandal', desc: 'A sandal painted with a happy face. You must eat the sandal.', category: 'mystery-gross' },
    { name: 'Bunion Soup', desc: 'French bunion soup with hangnail crackers. Straight from Chef\'s bathroom floor.', category: 'mystery-gross' },
    { name: 'Dumpster Juice Cocktail', desc: 'Liquid from the bottom of a dumpster. Strained. Garnished with a lemon.', category: 'mystery-gross' },
    { name: 'Gym Sock Tea', desc: 'Steeped gym socks. One sugar. Served hot.', category: 'mystery-gross' },
    { name: 'Armpit Sweat Lemonade', desc: 'Lemonade with an extra ingredient. Salty.', category: 'mystery-gross' },
    { name: 'Banana Peel Soup', desc: 'Banana peels, fish heads, and soda cans. Boiled into a soup.', category: 'mystery-gross' },
    { name: 'Drain Hair Dumplings', desc: 'Dumplings stuffed with shower drain hair. Chewy.', category: 'mystery-gross' },
    { name: 'Floor Sweepings Pie', desc: 'Everything swept off the kitchen floor, baked in a pie crust.', category: 'mystery-gross' },
    { name: 'Dust Bunny Donuts', desc: 'Donuts rolled in actual dust bunnies instead of powdered sugar.', category: 'mystery-gross' },
    { name: 'Old Sponge Sashimi', desc: 'Sliced kitchen sponge. Aged. Served raw.', category: 'mystery-gross' },
    { name: 'Lint Roller Lollipop', desc: 'A used lint roller sheet wrapped around a stick. Lick.', category: 'mystery-gross' },
    { name: 'Mystery Can Roulette', desc: 'An unlabelled can. Could be anything. Probably bad.', category: 'mystery-gross' },
    { name: 'Used Bandaid Bisque', desc: 'A creamy soup with used bandaids floating in it.', category: 'mystery-gross' },
    { name: 'Toilet Seat Tartine', desc: 'Open-faced sandwich on a toilet seat-shaped bread. The bread touched a real one.', category: 'mystery-gross' },
    { name: 'Belly Button Lint Soup', desc: 'A warm broth of collected belly button lint. Seasoned.', category: 'mystery-gross' },
  ],
  'morally-questionable': [
    { name: 'Dolphin Wieners', desc: 'Hot dogs made from dolphin. They\'re your ocean friends.', category: 'morally-questionable' },
    { name: 'Endangered Fish Sushi', desc: 'Made from a fish that\'s almost extinct. Rolls beautifully.', category: 'morally-questionable' },
    { name: 'Baby Seal Jerky', desc: 'Dried baby seal meat. Those eyes will haunt you.', category: 'morally-questionable' },
    { name: 'Panda Bear Pepperoni', desc: 'Black and white pepperoni. From what you think.', category: 'morally-questionable' },
    { name: 'Whale Blubber Bites', desc: 'Cubed whale fat. Rubbery. The ethical implications are worse than the taste.', category: 'morally-questionable' },
    { name: 'Horse Burger', desc: 'A burger. From a horse. Not a unicorn. That\'s next course.', category: 'morally-questionable' },
    { name: 'Bald Eagle Eggs Benedict', desc: 'Poached eggs from a national symbol. With hollandaise.', category: 'morally-questionable' },
    { name: 'Koala Kebab', desc: 'Skewered koala. They were so cute. Now they\'re on a stick.', category: 'morally-questionable' },
    { name: 'Sea Turtle Soup', desc: 'An ancient creature, boiled. It lived 80 years for this.', category: 'morally-questionable' },
    { name: 'Manatee Meatball', desc: 'The sea cow, balled up. Gentle giants. Gentle flavour.', category: 'morally-questionable' },
    { name: 'Dodo Bird Drumstick', desc: 'They went extinct once. Chef found more. Somehow.', category: 'morally-questionable' },
    { name: 'Puffin Poutine', desc: 'Fries, gravy, cheese curds, and shredded puffin.', category: 'morally-questionable' },
    { name: 'Penguin Pot Pie', desc: 'Under the crust, a penguin. A whole one.', category: 'morally-questionable' },
    { name: 'Albatross Alfredo', desc: 'Pasta in a creamy albatross sauce. Bad luck to eat one.', category: 'morally-questionable' },
    { name: 'Narwhal Nuggets', desc: 'The unicorn of the sea, breaded and fried.', category: 'morally-questionable' },
  ],
};
const BRUNCH_FOOD_CATEGORIES = Object.keys(BRUNCH_FOOD_POOL);

// Eat-off tiebreaker dish
const BRUNCH_EATOFF_DISH = { name: 'Cockroach Smoothie Shots', desc: 'Eight cockroaches blended into a chunky smoothie. Rich in vitamins. Fifteen shot glasses. Drink up.', category: 'eatoff' };
```

- [ ] **Step 2: Add reaction text pools**

Insert immediately after the food pool:

```javascript
// ── Brunch reaction text pools ──
const BRUNCH_REACTIONS = {
  // Eating success — by method
  eatSuccess: [
    (p, pr, dish) => `${p} held ${pr.posAdj} nose and swallowed. Done. Don't ask how it tasted.`,
    (p, pr, dish) => `${p} closed ${pr.posAdj} eyes, meditated for three seconds, and ate ${dish} like it was air.`,
    (p, pr, dish) => `${p} poured it straight down ${pr.posAdj} throat, bypassing tongue and taste buds entirely.`,
    (p, pr, dish) => `${p} chewed exactly once then swallowed whole. Speed over flavour.`,
    (p, pr, dish) => `${p} covered it in hot sauce first. "Now it just tastes like hot sauce."`,
    (p, pr, dish) => `${p} stared at the ceiling the entire time and refused to look down.`,
    (p, pr, dish) => `${p} ate it so fast nobody could tell if it was bravery or panic.`,
    (p, pr, dish) => `${p} put it between two crackers like that makes it a sandwich. It doesn't.`,
  ],
  // Eating success — archetype flavoured (keyed by archetype)
  eatArchetype: {
    'villain':    [(p, pr, dish) => `${p} ate ${dish} with a smirk, then looked at the other team. "Your turn."`,
                   (p, pr, dish) => `${p} finished the plate and licked ${pr.posAdj} fingers. A performance.`],
    'schemer':    [(p, pr, dish) => `${p} watched everyone else struggle first, then ate ${dish} like it was nothing. Calculated.`,
                   (p, pr, dish) => `${p} ate it quietly. No reaction. ${pr.Sub} ${pr.sub === 'they' ? 'want' : 'wants'} the other team to wonder.`],
    'mastermind': [(p, pr, dish) => `"It's just protein." ${p} ate ${dish} with clinical detachment.`,
                   (p, pr, dish) => `${p} analysed the dish, identified the least offensive bite, and worked systematically.`],
    'hero':       [(p, pr, dish) => `${p} grimaced but powered through. For the team.`,
                   (p, pr, dish) => `${p} ate it like a soldier eating rations. Not enjoyable. Not the point.`],
    'loyal-soldier': [(p, pr, dish) => `${p} looked at ${pr.posAdj} teammates, nodded, and ate. That's loyalty.`,
                      (p, pr, dish) => `${p} wasn't going to be the one to let the team down.`],
    'chaos-agent':[(p, pr, dish) => `${p} asked for seconds. Actually asked for seconds. The table went silent.`,
                   (p, pr, dish) => `${p} ate ${dish} and smiled. A real smile. That's the scary part.`],
    'hothead':    [(p, pr, dish) => `${p} slammed the plate after finishing. "NEXT."`,
                   (p, pr, dish) => `${p} angry-ate ${dish}. Every bite was a statement.`],
    'wildcard':   [(p, pr, dish) => `${p} took one look at ${dish} and said "I've had worse." Nobody knows if that's true.`,
                   (p, pr, dish) => `${p}'s reaction to ${dish} was... confusing. ${pr.Sub} hummed.`],
    'underdog':   [(p, pr, dish) => `Nobody expected ${p} to handle ${dish}. ${pr.Sub} did. The table noticed.`,
                   (p, pr, dish) => `${p} proved something today. ${pr.Sub} ate ${dish} without flinching.`],
    'floater':    [(p, pr, dish) => `${p} ate it without fanfare. Just... did it. Quietly effective.`,
                   (p, pr, dish) => `${p} finished before anyone noticed ${pr.sub} started.`],
    'showmancer': [(p, pr, dish) => `${p} gagged dramatically, recovered dramatically, and finished dramatically. The crowd loved it.`,
                   (p, pr, dish) => `${p} made eating ${dish} look like a performance. Horrified and glamorous at the same time.`],
    'social-butterfly': [(p, pr, dish) => `${p} rallied the table while eating. "We can DO this!" Mouth full.`,
                         (p, pr, dish) => `${p} turned eating ${dish} into a group moment. Everyone cheered ${pr.obj} on.`],
  },
  // Struggling but succeeding
  eatStruggle: [
    (p, pr, dish) => `${p} gagged mid-bite. Jaw locked. Teammates talked ${pr.obj} through opening ${pr.posAdj} mouth again.`,
    (p, pr, dish) => `${p} swallowed and couldn't speak for 30 seconds. Just... stared.`,
    (p, pr, dish) => `Tears streaming. "I'm not crying, my eyes are watering." Nobody believed ${p}.`,
    (p, pr, dish) => `${p} finished the plate then walked outside for a full minute.`,
    (p, pr, dish) => `${p} technically ate it — held it in ${pr.posAdj} mouth for the full countdown then spit it out after the point was scored.`,
    (p, pr, dish) => `${p}'s whole body shuddered. But ${pr.sub} kept it down. That counts.`,
    (p, pr, dish) => `${p} made a sound that wasn't a word. But ${pr.sub} made it through.`,
  ],
  // Dominant eat (very high roll)
  eatDominant: [
    (p, pr, dish) => `${p} ate ${dish} and asked what's for dessert. The table couldn't believe it.`,
    (p, pr, dish) => `${p} finished first. Looked around. "Was that supposed to be hard?"`,
    (p, pr, dish) => `${p} ate ${dish} like it was gourmet. Either brave or broken.`,
    (p, pr, dish) => `${p} didn't just eat it — ${pr.sub} savoured it. The other team lost their nerve watching.`,
    (p, pr, dish) => `${p} cleaned the plate. Burped. Smiled. The power move of the day.`,
  ],
  // Fail reactions
  eatFail: [
    (p, pr, dish) => `${p} tried. You could see ${pr.obj} trying. But ${dish} won.`,
    (p, pr, dish) => `${p} got it halfway to ${pr.posAdj} mouth and put it back down. "I can't."`,
    (p, pr, dish) => `${p} took one bite, turned green, and it came back up. The team loses this course.`,
    (p, pr, dish) => `${p} looked at ${dish} for ten seconds without moving. Then pushed the plate away.`,
    (p, pr, dish) => `${p} gagged before it touched ${pr.posAdj} lips. The smell alone was enough.`,
    (p, pr, dish) => `${p} held it in ${pr.posAdj} mouth for three seconds. Then lost the battle.`,
    (p, pr, dish) => `"Nope." ${p} didn't even try. Plate untouched. Course lost.`,
    (p, pr, dish) => `${p} put it in ${pr.posAdj} mouth. Chewed once. The texture was the end.`,
  ],
  // Refusal reactions — by type
  refuseMoral: [
    (p, pr, dish) => `${p} looked at ${dish} and said "I won't eat that. I don't care if we lose."`,
    (p, pr, dish) => `"That's not food. That's an animal that trusts people." ${p} pushed the plate away.`,
    (p, pr, dish) => `${p} stood up. "I'm not eating ${dish}. Vote me out if you want."`,
  ],
  refuseDisgust: [
    (p, pr, dish) => `${p} physically can't. Opens mouth, gags, pushes plate away. The body said no.`,
    (p, pr, dish) => `${p} picked it up, smelled it, put it back down, and said "I have made my decision."`,
    (p, pr, dish) => `${p} looked at ${dish} so long the host asked if ${pr.sub} ${pr.sub === 'they' ? 'were' : 'was'} trying to kill it with ${pr.posAdj} eyes.`,
  ],
  refuseProtest: [
    (p, pr, dish) => `"This isn't food. This is a war crime." ${p} folded ${pr.posAdj} arms.`,
    (p, pr, dish) => `${p} tried to negotiate. "What if I eat half?" Host said no.`,
    (p, pr, dish) => `"I'd rather go to tribal." ${p} knows what refusing costs. Doesn't care.`,
  ],
  refuseHalfway: [
    (p, pr, dish) => `${p} started eating. Got halfway. The texture changed and ${pr.sub} couldn't finish. Team gets nothing.`,
    (p, pr, dish) => `${p} was so close. Three bites left. But the body quit before the brain did.`,
  ],
  // Convinced to eat
  convinced: [
    (p, pr, convincer) => `${convincer} put a hand on ${p}'s shoulder. "You can do this. For us." ${p} closed ${pr.posAdj} eyes and ate.`,
    (p, pr, convincer) => `${convincer} stared at ${p}. "If I ate it, you can eat it." Peer pressure won.`,
    (p, pr, convincer) => `${p} looked at ${convincer}, took a breath, and forced it down. Not gracefully. But done.`,
    (p, pr, convincer) => `"Fine. FINE." ${p} ate it aggressively, glaring at ${convincer} the entire time.`,
    (p, pr, convincer) => `${convincer} counted to three. ${p} ate on three. Teamwork, technically.`,
  ],
  // Cross-team convinced
  convincedCrossTeam: [
    (p, pr, partner) => `${partner} mouthed "you got this" from the other team. ${p} ate. The whole room noticed.`,
    (p, pr, partner) => `${partner} gave ${p} a look that said everything. ${p} picked up the fork. The team behind ${partner} was not happy.`,
    (p, pr, partner) => `${p} looked at ${partner} across the table. ${partner} nodded. ${p} ate. Both teams had feelings about it.`,
  ],
  // Chain vomit
  chainVomitTrigger: [
    (p, pr) => `${p} lost it. The sound alone was enough to start a chain reaction.`,
    (p, pr) => `${p}'s whole body rejected the food. Violently. The table went quiet, then went green.`,
    (p, pr) => `${p} didn't just fail — ${pr.sub} created a biohazard. What came out was worse than what went in.`,
  ],
  chainVomitAffected: [
    (p, pr) => `${p} was fine until ${pr.sub} saw that. Now ${pr.sub} ${pr.sub === 'they' ? 'aren\'t' : 'isn\'t'} fine.`,
    (p, pr) => `${p} tried to look away. Too late. The sympathy gag hit hard.`,
    (p, pr) => `${p} held it together for three seconds after the chain started. Then lost it.`,
  ],
  chainVomitResisted: [
    (p, pr) => `${p} somehow kept it together while everyone around ${pr.obj} lost it. Iron stomach.`,
    (p, pr) => `${p} gripped the table, breathed through ${pr.posAdj} nose, and refused to join the cascade.`,
  ],
  // Spectator reactions from other team
  spectatorImpressed: [
    (p, pr, eater) => `Even ${p} had to respect what ${eater} just did.`,
    (p, pr, eater) => `${p} watched ${eater} eat that and said nothing. But the expression said everything.`,
  ],
  spectatorDisgusted: [
    (p, pr, eater) => `${p} turned away watching ${eater} eat. Couldn't handle it even as a spectator.`,
    (p, pr, eater) => `${p} covered ${pr.posAdj} eyes. Watching the other team eat was almost as bad as eating.`,
  ],
  spectatorTaunting: [
    (p, pr, eater) => `"That's it? We finished ours already." ${p} grinned at ${eater}.`,
    (p, pr, eater) => `${p} slow-clapped from the other side. The sarcasm was audible.`,
  ],
  spectatorNervous: [
    (p, pr, eater) => `${p} watched ${eater} succeed and went pale. They're next.`,
    (p, pr, eater) => `${p}'s confidence dropped watching ${eater} dominate that dish.`,
  ],
  // Post-eating micro-reactions
  postEat: [
    (p, pr) => `${p} sat very still and breathed through ${pr.posAdj} nose for a concerning amount of time.`,
    (p, pr) => `${p} made a noise that wasn't a word.`,
    (p, pr) => `${p} smiled. Nobody believed the smile.`,
    (p, pr) => `${p} burped and the entire table flinched.`,
    (p, pr) => `"Never speak of this again." ${p} pushed the empty plate away.`,
    (p, pr) => `${p} stared at the empty plate like it owed ${pr.obj} money.`,
  ],
};
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat(brunch): add food pools (75 dishes, 5 categories) and reaction text pools"
```

---

### Task 2: Twist catalog entry + applyTwist handler + simulateEpisode dispatch

**Files:**
- Modify: `simulator.html` — twist catalog (~line 2327), applyTwist (~line 29797), simulateEpisode (~line 41154), updateChalRecord skip list (~line 41500), camp event boosts (~line 38747), patchEpisodeHistory (~line 50054), timeline tag (~line 50757)

This task wires up the twist without implementing the simulation function yet. It creates a stub `simulateBrunchOfDisgustingness` that will be filled in Task 3.

- [ ] **Step 1: Add twist catalog entry**

Find the say-uncle catalog entry (search for `id:'say-uncle'`). Insert AFTER it (before the next entry):

```javascript
  { id:'brunch-of-disgustingness', emoji:'🤮', name:'Brunch of Disgustingness', category:'challenge', phase:'post-merge', desc:'Boys vs girls eating challenge at merge. 9 courses of disgusting food — every member must eat or the team loses the course. Chain vomiting. Eat-off tiebreaker. Losing team goes to tribal.', engineType:'brunch-of-disgustingness', incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','brunch-of-disgustingness'] },
```

- [ ] **Step 2: Add applyTwist handler**

Find the say-uncle handler in applyTwist (search for `engineType === 'say-uncle'`). Add a new handler after it:

```javascript
  } else if (engineType === 'brunch-of-disgustingness') {
    if (!gs.isMerged && gs.activePlayers.length > (seasonConfig.mergeAt || 12)) return; // post-merge only
    if (gs.activePlayers.length < 4) return; // need at least 4 players
    ep.isBrunchOfDisgustingness = true;

    // Split into boys/girls teams based on pronouns
    const boys = [], girls = [];
    gs.activePlayers.forEach(name => {
      const pr = pronouns(name);
      if (pr.sub === 'he') boys.push(name);
      else if (pr.sub === 'she') girls.push(name);
      else (boys.length <= girls.length ? boys : girls).push(name); // they/them goes to smaller team
    });

    // Balance teams — move 1-2 from larger to smaller if needed
    const crossovers = [];
    while (Math.abs(boys.length - girls.length) > 1) {
      const larger = boys.length > girls.length ? boys : girls;
      const smaller = boys.length > girls.length ? girls : boys;
      const fromLabel = boys.length > girls.length ? 'boys' : 'girls';
      const toLabel = boys.length > girls.length ? 'girls' : 'boys';
      // Pick player with lowest avg bond with their own team
      const candidate = larger.reduce((worst, name) => {
        const avgBond = larger.filter(n => n !== name).reduce((sum, n) => sum + getBond(name, n), 0) / Math.max(1, larger.length - 1);
        return avgBond < worst.avgBond ? { name, avgBond } : worst;
      }, { name: larger[0], avgBond: Infinity });
      larger.splice(larger.indexOf(candidate.name), 1);
      smaller.push(candidate.name);
      crossovers.push({ name: candidate.name, from: fromLabel, to: toLabel });
    }

    ep.brunchTeams = { boys: [...boys], girls: [...girls], crossovers };
  }
```

- [ ] **Step 3: Add simulateEpisode dispatch**

Find where `simulateSayUncle(ep)` is called in simulateEpisode (search for `simulateSayUncle`). Add after the say-uncle dispatch block:

```javascript
  } else if (ep.isBrunchOfDisgustingness) {
    simulateBrunchOfDisgustingness(ep);
    ep.tribalPlayers = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  }
```

- [ ] **Step 4: Add stub simulation function**

Find where `simulateSayUncle` function is defined (search for `function simulateSayUncle`). Insert BEFORE it:

```javascript
// ══════════════════════════════════════════════════════════════════════
// ENGINE: BRUNCH OF DISGUSTINGNESS
// ══════════════════════════════════════════════════════════════════════
function simulateBrunchOfDisgustingness(ep) {
  // TODO: will be implemented in Tasks 3-5
  const teams = ep.brunchTeams;
  if (!teams) return;

  ep.brunch = {
    cabinEvents: { boys: [], girls: [] },
    teamCohesion: { boys: 0.5, girls: 0.5 },
    courses: [],
    crossTeamBreaks: [],
    eatOff: null,
    score: { boys: 0, girls: 0 },
    winningTeam: 'boys',
    mvpEater: teams.boys[0],
    worstEater: teams.girls[0],
    postCabinEvents: { boys: [], girls: [] },
  };

  // Stub — set basic challenge metadata
  ep.immunityWinner = null; // no individual winner
  ep.challengeType = 'team';
  ep.challengeLabel = 'Brunch of Disgustingness';
  ep.challengeCategory = 'eating';
  ep.challengeDesc = 'Boys vs girls eating challenge — 9 courses of disgusting food.';
  ep.chalMemberScores = {};
  gs.activePlayers.forEach(name => { ep.chalMemberScores[name] = 0; });

  // Winning team gets immunity
  const winningMembers = teams[ep.brunch.winningTeam];
  ep.extraImmune = [...new Set([...(ep.extraImmune || []), ...winningMembers])];

  updateChalRecord(ep);
}
```

- [ ] **Step 5: Add updateChalRecord skip list entry**

Find the long `if (!ep.isDodgebrawl && ...` condition that guards the main updateChalRecord call (search for `!ep.isSayUncle`). Add `&& !ep.isBrunchOfDisgustingness` to the condition.

- [ ] **Step 6: Add camp event boost**

Find `case 'say-uncle':` in the camp event boost switch (search for it in the boost context). Add after the say-uncle break:

```javascript
      case 'brunch-of-disgustingness':
        // Social chaos — gender split + eating stress + blame game
        boost('dispute', 30); boost('tdStrategy', 25);
        boost('confessional', 25); boost('fight', 20);
        boost('doubt', 15); boost('rumor', 15);
        break;
```

- [ ] **Step 7: Add patchEpisodeHistory storage**

Find `if (ep.isSayUncle) h.isSayUncle = true;` in patchEpisodeHistory. Add after it:

```javascript
  if (ep.isBrunchOfDisgustingness) { h.isBrunchOfDisgustingness = true; if (ep.brunch) h.brunch = ep.brunch; }
```

- [ ] **Step 8: Add timeline tag**

Find the Say Uncle timeline tag (search for `const suTag = ep.isSayUncle`). Add after it:

```javascript
  const brunchTag = ep.isBrunchOfDisgustingness ? `<span class="ep-hist-tag" style="background:rgba(74,222,128,0.15);color:#4ade80">Brunch</span>` : '';
```

Then find where `suTag` is used in the timeline HTML concatenation and add `${brunchTag}` next to it.

- [ ] **Step 9: Commit**

```bash
git add simulator.html
git commit -m "feat(brunch): twist catalog, applyTwist team split, simulateEpisode dispatch, stub simulation"
```

---

### Task 3: Cabin dynamics engine

**Files:**
- Modify: `simulator.html` — inside `simulateBrunchOfDisgustingness`

Replace the stub with the cabin dynamics phase. This generates 7-8 events per team.

- [ ] **Step 1: Implement cabin dynamics**

Find the `simulateBrunchOfDisgustingness` function. Replace the stub content (everything after `if (!teams) return;`) with the cabin dynamics implementation. The function will be large — here's the structure:

```javascript
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const teamNames = ['boys', 'girls'];
  const teamMembers = { boys: [...teams.boys], girls: [...teams.girls] };

  // ══════════════════════════════════════════════════════════════
  // PHASE 1: CABIN DYNAMICS
  // ══════════════════════════════════════════════════════════════
  const cabinEvents = { boys: [], girls: [] };
  const teamCohesion = { boys: 0, girls: 0 };

  // Calculate initial cohesion per team (average pairwise bonds)
  teamNames.forEach(team => {
    const members = teamMembers[team];
    let bondSum = 0, bondCount = 0;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        bondSum += getBond(members[i], members[j]);
        bondCount++;
      }
    }
    teamCohesion[team] = bondCount ? Math.max(0, Math.min(1, (bondSum / bondCount + 5) / 10)) : 0.5;
  });
```

Then for each team, generate 7-8 cabin events using a weighted event pool system. Each event should:
- Pick from bonding/power/social/confrontation pools based on team cohesion
- Use actual player names, stats, archetypes, and bond values
- Modify bonds via `addBond(a, b, delta)`
- Store events with `{ type, players: [], text, badgeText, badgeClass }`
- Update cohesion score after each event

The cabin event pool should include ALL events from the spec's "Shared Cabin Event Pool" section. Use the actual game state (`pStats()`, `getBond()`, `pronouns()`, archetype lookups via `players.find(p => p.name === name)?.archetype`) to select events and generate text.

**Key patterns to follow:**
- Find highest strategic player: `teamMembers[team].reduce((best, n) => pStats(n).strategic > pStats(best).strategic ? n : best)`
- Find worst-bond pair: iterate all pairs, find minimum bond
- Find outsider: player with lowest average bond to team

After generating events, check for showmance pairs:
- Split across teams → separation moment via `_challengeRomanceSpark` or `_checkShowmanceChalMoment`
- Same team → comfort moment

Store results:
```javascript
  cabinEvents[team] = events; // array of event objects
  teamCohesion[team] = updatedCohesion; // 0-1 after all events
```

This is a large implementation step. The engineer should write 7-8 event generators per team, each producing a `{ type, players, text, badgeText, badgeClass }` object. Follow the pattern used by Hell's Kitchen for event generation — read `simulateHellsKitchen` (search for it) to see how events are structured with `pushEvent` and badge patterns.

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(brunch): cabin dynamics engine — 7-8 social events per team with bond/archetype logic"
```

---

### Task 4: 9-course eating challenge engine

**Files:**
- Modify: `simulator.html` — continue inside `simulateBrunchOfDisgustingness`

After the cabin dynamics, implement the 9-course eating loop.

- [ ] **Step 1: Implement the eating challenge**

After the cabin dynamics code, add:

```javascript
  // ══════════════════════════════════════════════════════════════
  // PHASE 2: THE BRUNCH — 9 COURSES
  // ══════════════════════════════════════════════════════════════
  const courses = [];
  const usedDishes = new Set();
  let lastCategory = null;
  const score = { boys: 0, girls: 0 };
  const playerEatScores = {}; // cumulative per-player eating performance
  gs.activePlayers.forEach(n => { playerEatScores[n] = 0; });
  const chainVomitPenalties = {}; // player → penalty for next course
  gs.activePlayers.forEach(n => { chainVomitPenalties[n] = 0; });
```

Then implement a loop for 9 courses. Each course:

**a) Dish selection:** Pick random category (no same category twice in a row), then random dish from that category. Mark as used.

**b) Refusal check per player:** Before the eating roll. Per the spec:
- Base refusal chance: `(10 - boldness) * 0.02`
- Category modifier: `+0.10` if archetype matches refusal trigger (hero/loyal-soldier for morally-questionable and meat-gross; low boldness + high social for bug-gross; low endurance for texture-gross; low boldness for mystery-gross)
- Cohesion modifier: `+0.05` if team cohesion < 0.3
- Wildcard: flat 8% for any category
- Chain vomit hangover: `+0.05` if previously affected
- Roll against threshold — if `Math.random() < refusalChance`, player refuses

**c) Pressure-to-eat if refused:** Highest social teammate tries to convince:
- Convincer: `social * 0.04 + loyalty * 0.03` (use `pStats(name).social` and `pStats(name).loyalty`)
- Refuser resistance: `(10 - pStats(name).boldness) * 0.03 + (10 - pStats(name).temperament) * 0.04`
- If `convincerScore > refuserResistance + Math.random() * 0.1`: convinced, eats with `-0.05` penalty
- Cross-team partner attempt if showmance/bond ≥ 4: same check, but successful = `-0.3` bond with own teammates

**d) Eating roll per player:** `boldness * 0.04 + endurance * 0.03 + strategic * 0.02 + Math.random() * 0.15` + cohesion modifier (`+0.02` if > 0.6) + chain vomit penalty - convince penalty
- Pass: `≥ 0.35`
- Dominant: `≥ 0.60`
- Fail: `< 0.35`

**e) Select reaction text** from `BRUNCH_REACTIONS` based on result + archetype. Use the function-style text pools: `BRUNCH_REACTIONS.eatSuccess[idx](playerName, pronouns(playerName), dish.name)`

**f) Chain vomit check:** If any player fails with roll < 0.20, trigger chain check on all players on BOTH teams:
- Per player: `endurance * 0.05 + Math.random() * 0.1` — if < 0.30, affected
- Affected players get `-0.03` penalty stored in `chainVomitPenalties`

**g) Course result:** Team wins only if ALL members passed. Both teams can fail (0-0).

**h) Cross-team break events** at courses 3 and 6: generate 5+ events per the spec's cross-team break section. Store in `crossTeamBreaks[]`.

**i) Update `playerEatScores`:** +1 per course eaten, +0.5 for dominant, -2 for refusal, -1 for chain vomit trigger.

Store each course:
```javascript
  courses.push({
    courseNum,
    dish,
    boysResults: [...], // { player, roll, result, reaction, convincedBy? }
    girlsResults: [...],
    chainVomit: { trigger, affected, reactions },
    boysWon, girlsWon,
  });
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat(brunch): 9-course eating engine — refusals, pressure-to-eat, chain vomit, cross-team breaks"
```

---

### Task 5: Eat-off tiebreaker + scoring + camp events + reward

**Files:**
- Modify: `simulator.html` — continue inside `simulateBrunchOfDisgustingness`

After the 9-course loop, add the eat-off, final scoring, camp events, and reward.

- [ ] **Step 1: Implement eat-off tiebreaker**

```javascript
  // ══════════════════════════════════════════════════════════════
  // EAT-OFF TIEBREAKER (if tied)
  // ══════════════════════════════════════════════════════════════
  let eatOff = null;
  if (score.boys === score.girls) {
    // Best eater from each team
    const bestBoy = teams.boys.reduce((best, n) => playerEatScores[n] > playerEatScores[best] ? n : best);
    const bestGirl = teams.girls.reduce((best, n) => playerEatScores[n] > playerEatScores[best] ? n : best);

    const shots = [];
    let boysShots = 0, girlsShots = 0;
    for (let shotNum = 1; shotNum <= 15; shotNum++) {
      const threshold = 0.30 + (shotNum - 1) * 0.02; // escalating difficulty
      const boyRoll = pStats(bestBoy).endurance * 0.05 + pStats(bestBoy).boldness * 0.03 + Math.random() * 0.1;
      const girlRoll = pStats(bestGirl).endurance * 0.05 + pStats(bestGirl).boldness * 0.03 + Math.random() * 0.1;
      const boyPass = boyRoll >= threshold;
      const girlPass = girlRoll >= threshold;

      shots.push({ shotNum, boyRoll, girlRoll, boyPass, girlPass });

      if (boyPass) boysShots++;
      if (girlPass) girlsShots++;

      if (!boyPass && !girlPass) {
        // Both fail same shot — sudden death
        const sdBoy = Math.random() * 0.5 + pStats(bestBoy).endurance * 0.03;
        const sdGirl = Math.random() * 0.5 + pStats(bestGirl).endurance * 0.03;
        if (sdBoy >= sdGirl) boysShots++;
        else girlsShots++;
        break;
      }
      if (!boyPass || !girlPass) break; // one failed, other wins
    }

    const eatOffWinner = boysShots >= girlsShots ? 'boys' : 'girls';
    score[eatOffWinner]++;
    playerEatScores[eatOffWinner === 'boys' ? bestBoy : bestGirl] += 3;
    playerEatScores[eatOffWinner === 'boys' ? bestGirl : bestBoy] += 1;

    eatOff = {
      boysEater: bestBoy, girlsEater: bestGirl,
      shots, boysShots, girlsShots,
      winner: eatOffWinner === 'boys' ? bestBoy : bestGirl,
      winnerTeam: eatOffWinner,
    };
  }
```

- [ ] **Step 2: Determine winner, MVP, worst eater**

```javascript
  const winningTeam = score.boys >= score.girls ? 'boys' : 'girls';
  const losingTeam = winningTeam === 'boys' ? 'girls' : 'boys';
  const winningMembers = teamMembers[winningTeam];
  const losingMembers = teamMembers[losingTeam];

  // MVP = highest eating score on winning team
  const mvpEater = winningMembers.reduce((best, n) => playerEatScores[n] > playerEatScores[best] ? n : best);
  // Worst = lowest eating score across all players
  const worstEater = gs.activePlayers.reduce((worst, n) => playerEatScores[n] < playerEatScores[worst] ? n : worst);
```

- [ ] **Step 3: Set challenge metadata and immunity**

```javascript
  ep.brunch = {
    cabinEvents, teamCohesion, courses, crossTeamBreaks,
    eatOff, score, winningTeam, losingTeam,
    mvpEater, worstEater,
    postCabinEvents: { boys: [], girls: [] }, // filled by post-challenge events
    playerEatScores,
  };

  ep.immunityWinner = null; // team immunity, no individual winner
  ep.challengeType = 'team';
  ep.challengeLabel = 'Brunch of Disgustingness';
  ep.challengeCategory = 'eating';
  ep.challengeDesc = 'Boys vs girls eating challenge — 9 courses of disgusting food.';
  ep.chalPlacements = [...winningMembers, ...losingMembers]; // winners ranked first
  ep.chalMemberScores = playerEatScores;

  // Winning team gets immunity
  ep.extraImmune = [...new Set([...(ep.extraImmune || []), ...winningMembers])];
```

- [ ] **Step 4: Add reward**

```javascript
  // Reward: survival restoration or advantage
  if (seasonConfig.survivalEnabled || seasonConfig.foodWater) {
    // Restore food/water for winning team
    winningMembers.forEach(name => {
      if (gs.playerFood) gs.playerFood[name] = Math.min(10, (gs.playerFood[name] || 5) + 5);
      if (gs.playerWater) gs.playerWater[name] = Math.min(10, (gs.playerWater[name] || 5) + 5);
    });
  } else {
    // MVP gets a minor advantage
    const advTypes = ['extra-vote', 'vote-blocker', 'immunity-totem'];
    const advType = _rp(advTypes);
    if (!gs.advantages) gs.advantages = [];
    gs.advantages.push({
      type: advType, holder: mvpEater, origin: 'brunch-mvp',
      label: `${advType.replace(/-/g, ' ')} (Brunch MVP)`, episode: gs.episode,
    });
  }

  // Bond adjustments — winning team bonds up, losing team fractures
  for (let i = 0; i < winningMembers.length; i++) {
    for (let j = i + 1; j < winningMembers.length; j++) {
      addBond(winningMembers[i], winningMembers[j], 0.5);
    }
  }
  for (let i = 0; i < losingMembers.length; i++) {
    for (let j = i + 1; j < losingMembers.length; j++) {
      addBond(losingMembers[i], losingMembers[j], -0.2);
    }
  }
```

- [ ] **Step 5: Generate post-challenge cabin events and camp events**

Generate 7-8 post-challenge events per team using the winning/losing team pools from the spec. Follow the same pattern as pre-challenge cabin events (Task 3). Store in `ep.brunch.postCabinEvents`.

Then generate camp events with badges:

```javascript
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };

  // MVP badge
  ep.campEvents[campKey].post.push({
    type: 'brunchMVP', players: [mvpEater],
    text: `${mvpEater} ate everything the Brunch of Disgustingness threw at ${pronouns(mvpEater).obj}. MVP of the eating challenge.`,
    badgeText: 'MVP EATER', badgeClass: 'gold',
  });

  // Worst eater badge
  ep.campEvents[campKey].post.push({
    type: 'brunchWorst', players: [worstEater],
    text: `${worstEater} struggled the most at the Brunch. The team noticed.`,
    badgeText: 'WEAKEST STOMACH', badgeClass: 'red',
  });

  // Chain vomit triggers
  courses.forEach(c => {
    if (c.chainVomit?.trigger) {
      ep.campEvents[campKey].post.push({
        type: 'brunchChainVomit', players: [c.chainVomit.trigger],
        text: `${c.chainVomit.trigger} started a chain reaction at the Brunch. Multiple people went down.`,
        badgeText: 'CHAIN REACTION', badgeClass: 'red',
      });
    }
  });

  // Iron stomach — player who ate every course without struggling
  const ironStomachs = gs.activePlayers.filter(name =>
    courses.every(c => {
      const results = [...(c.boysResults || []), ...(c.girlsResults || [])];
      const pr = results.find(r => r.player === name);
      return pr && (pr.result === 'pass' || pr.result === 'dominant');
    })
  );
  ironStomachs.forEach(name => {
    ep.campEvents[campKey].post.push({
      type: 'brunchIronStomach', players: [name],
      text: `${name} ate every single course without flinching. Iron stomach.`,
      badgeText: 'IRON STOMACH', badgeClass: 'gold',
    });
  });

  updateChalRecord(ep);
```

- [ ] **Step 6: Commit**

```bash
git add simulator.html
git commit -m "feat(brunch): eat-off tiebreaker, scoring, immunity, reward, camp events"
```

---

### Task 6: Text backlog

**Files:**
- Modify: `simulator.html` — add `_textBrunchOfDisgustingness` function + wire up the call

- [ ] **Step 1: Add text backlog function**

Find `_textSayUncle` function. Insert AFTER it a new function:

```javascript
function _textBrunchOfDisgustingness(ep, ln, sec) {
  const br = ep.brunch;
  if (!br) return;
  sec('BRUNCH OF DISGUSTINGNESS');
  ln(`Boys: ${ep.brunchTeams.boys.join(', ')}`);
  ln(`Girls: ${ep.brunchTeams.girls.join(', ')}`);
  if (ep.brunchTeams.crossovers?.length) {
    ep.brunchTeams.crossovers.forEach(c => ln(`  Crossover: ${c.name} (${c.from} → ${c.to})`));
  }
  ln('');

  // Cabin dynamics
  ['boys', 'girls'].forEach(team => {
    ln(`=== ${team.toUpperCase()} CABIN ===`);
    (br.cabinEvents[team] || []).forEach(e => {
      ln(`  ${e.text}`);
    });
    ln(`  Team Cohesion: ${(br.teamCohesion[team] * 100).toFixed(0)}%`);
    ln('');
  });

  // 9 courses
  sec('THE BRUNCH');
  br.courses.forEach(c => {
    ln(`Course ${c.courseNum}: [${c.dish.category.toUpperCase()}] ${c.dish.name}`);
    ln(`  ${c.dish.desc}`);
    ['boysResults', 'girlsResults'].forEach(key => {
      const teamLabel = key === 'boysResults' ? 'Boys' : 'Girls';
      (c[key] || []).forEach(r => {
        const status = r.result.toUpperCase() + (r.convincedBy ? ` (convinced by ${r.convincedBy})` : '');
        ln(`  ${teamLabel}: ${r.player} — ${status}`);
        if (r.reaction) ln(`    ${r.reaction}`);
      });
    });
    if (c.chainVomit?.trigger) {
      ln(`  CHAIN VOMIT triggered by ${c.chainVomit.trigger}`);
      (c.chainVomit.affected || []).forEach(a => ln(`    → ${a}`));
    }
    const bWin = c.boysWon ? 'WIN' : 'LOSE';
    const gWin = c.girlsWon ? 'WIN' : 'LOSE';
    ln(`  Result: Boys ${bWin}, Girls ${gWin} | Score: Boys ${br.score.boys}, Girls ${br.score.girls}`);
    ln('');
  });

  // Cross-team breaks
  if (br.crossTeamBreaks?.length) {
    br.crossTeamBreaks.forEach(b => {
      ln(`--- Cross-Team Break (after course ${b.afterCourse}) ---`);
      (b.events || []).forEach(e => ln(`  ${e.text}`));
      ln('');
    });
  }

  // Eat-off
  if (br.eatOff) {
    sec('EAT-OFF TIEBREAKER');
    ln(`${br.eatOff.boysEater} vs ${br.eatOff.girlsEater} — Cockroach Smoothie Shots`);
    br.eatOff.shots.forEach(s => {
      ln(`  Shot ${s.shotNum}: ${br.eatOff.boysEater} ${s.boyPass ? 'DRANK' : 'FAILED'} | ${br.eatOff.girlsEater} ${s.girlPass ? 'DRANK' : 'FAILED'}`);
    });
    ln(`  Winner: ${br.eatOff.winner} (${br.eatOff.boysShots} - ${br.eatOff.girlsShots})`);
    ln('');
  }

  // Results
  sec('RESULTS');
  ln(`Final Score: Boys ${br.score.boys} - Girls ${br.score.girls}`);
  ln(`Winner: ${br.winningTeam.toUpperCase()}`);
  ln(`MVP Eater: ${br.mvpEater}`);
  ln(`Worst Eater: ${br.worstEater}`);
  ln('');

  // Post-challenge events
  ['boys', 'girls'].forEach(team => {
    ln(`=== ${team.toUpperCase()} POST-CHALLENGE ===`);
    (br.postCabinEvents[team] || []).forEach(e => {
      ln(`  ${e.text}`);
    });
    ln('');
  });
}
```

- [ ] **Step 2: Wire up the text backlog call**

Find where `_textSayUncle(ep, ln, sec)` is called (search for it in the text backlog dispatch). Add after it:

```javascript
  if (ep.isBrunchOfDisgustingness) _textBrunchOfDisgustingness(ep, ln, sec);
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat(brunch): text backlog — phase-grouped output with cabin events, courses, eat-off"
```

---

### Task 7: VP Screen 1 (The Split) + Screen 2 (Cabin Dynamics)

**Files:**
- Modify: `simulator.html` — add VP builder functions + wire into vpScreens assembly

- [ ] **Step 1: Add CSS keyframes for Brunch overdrive**

Find the Say Uncle overdrive CSS section (search for `Say Uncle: Dungeon of Misfortune Overdrive`). Insert AFTER it:

```css
    /* ── Brunch of Disgustingness Overdrive ── */
    @keyframes brPlaceLift {
      0%   { transform: scaleY(1) translateY(0); opacity: 1; }
      100% { transform: scaleY(0) translateY(-10px); opacity: 0; }
    }
    @keyframes brStinkFloat {
      0%, 100% { opacity: 0.4; transform: translateY(0) translateX(0) rotate(0deg); }
      50%      { opacity: 0.7; transform: translateY(-15px) translateX(3px) rotate(5deg); }
    }
    @keyframes brSplatBurst {
      0%   { transform: scale(0) rotate(0deg); opacity: 0.8; }
      50%  { transform: scale(1.3) rotate(10deg); opacity: 0.6; }
      100% { transform: scale(1) rotate(5deg); opacity: 0.4; }
    }
    @keyframes brTraySlide {
      0%   { transform: translateX(-40px); opacity: 0; }
      100% { transform: translateX(0); opacity: 1; }
    }
    @keyframes brRefuseStamp {
      0%   { transform: scale(2) rotate(-15deg); opacity: 0; }
      60%  { transform: scale(0.9) rotate(2deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    @keyframes brVomitRipple {
      0%   { box-shadow: 0 0 0 0 rgba(132,204,22,0.4); }
      50%  { box-shadow: 0 0 15px 5px rgba(132,204,22,0.3); }
      100% { box-shadow: 0 0 0 0 rgba(132,204,22,0); }
    }
    @keyframes brShotFill {
      0%   { height: 0; }
      100% { height: 100%; }
    }
    @keyframes brShotDrain {
      0%   { transform: rotate(0deg); opacity: 1; }
      50%  { transform: rotate(-30deg); opacity: 0.8; }
      100% { transform: rotate(-60deg); opacity: 0.3; }
    }
    @keyframes brSlimeDrip {
      0%   { height: 0; opacity: 0.8; }
      100% { height: 30px; opacity: 0.3; }
    }
    @keyframes brGagShake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-4px); }
      40% { transform: translateX(4px); }
      60% { transform: translateX(-3px); }
      80% { transform: translateX(2px); }
    }
    @keyframes brCohesionCrack {
      0%   { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
      100% { clip-path: polygon(0 0, 48% 0, 45% 100%, 0 100%); }
    }
    @keyframes brConfettiSplat {
      0%   { transform: scale(0); opacity: 1; }
      50%  { transform: scale(1.5); opacity: 0.7; }
      100% { transform: scale(1); opacity: 0; }
    }
    @keyframes brPortraitSick {
      0%   { filter: brightness(1) hue-rotate(0deg); }
      33%  { filter: brightness(0.95) hue-rotate(20deg) saturate(0.8); }
      66%  { filter: brightness(0.85) hue-rotate(60deg) saturate(0.6); }
      100% { filter: brightness(0.75) hue-rotate(90deg) saturate(0.5); }
    }
    .br-canteen {
      position: relative; overflow: hidden;
      background: linear-gradient(180deg, #1a2118 0%, #141a12 100%);
    }
    .br-canteen::before {
      content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0;
      background: radial-gradient(ellipse 50% 30% at 50% 20%, rgba(74,222,128,0.04) 0%, transparent 70%);
    }
    .br-canteen > * { position: relative; z-index: 1; }
    .br-card-slam { animation: suCardSlam 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    .br-tray-slide { animation: brTraySlide 0.5s ease-out both; }
    .br-gag-shake { animation: brGagShake 0.4s ease-in-out both; }
    .br-vomit-ripple { animation: brVomitRipple 0.8s ease-out both; }
    .br-refuse-stamp { animation: brRefuseStamp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    .br-stink-line {
      position: absolute; width: 2px; pointer-events: none;
      background: linear-gradient(to top, rgba(74,222,128,0.3), transparent);
      animation: brStinkFloat 2s ease-in-out infinite;
    }
```

- [ ] **Step 2: Add VP Screen 1 (The Split) and Screen 2 (Cabin Dynamics)**

Find the Say Uncle VP functions (search for `_rp_hostPhaseIntro`). Insert BEFORE it:

```javascript
// ══════════════════════════════════════════════════════════════════════
// VP: BRUNCH OF DISGUSTINGNESS
// ══════════════════════════════════════════════════════════════════════

function rpBuildBrunchSplit(ep) {
  const br = ep.brunch;
  const teams = ep.brunchTeams;
  if (!br || !teams) return '';

  let html = `<div class="rp-page br-canteen">
    <div style="font-family:var(--font-display);font-size:26px;letter-spacing:4px;text-align:center;color:#4ade80;text-shadow:0 0 20px rgba(74,222,128,0.3);margin-bottom:2px;animation:scrollDrop 0.5s var(--ease-broadcast) both">BRUNCH OF DISGUSTINGNESS</div>
    <div style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#84cc16;text-align:center;margin-bottom:20px">Boys vs Girls Eating Challenge</div>

    <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-bottom:20px;max-width:560px;margin-left:auto;margin-right:auto">
      <div style="flex:1;min-width:200px;background:rgba(74,222,128,0.04);border:1px solid rgba(74,222,128,0.15);border-radius:8px;padding:14px;text-align:center">
        <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#4ade80;margin-bottom:10px">BOYS</div>
        <div class="rp-portrait-row" style="justify-content:center">${teams.boys.map(n => {
          const isCrossover = teams.crossovers.some(c => c.name === n);
          return `<div style="position:relative">${rpPortrait(n, 'sm')}${isCrossover ? '<div style="position:absolute;top:-4px;right:-4px;font-size:8px;font-weight:700;color:#facc15;background:rgba(250,204,21,0.2);border-radius:3px;padding:0 3px">SWAP</div>' : ''}</div>`;
        }).join('')}</div>
      </div>
      <div style="font-family:var(--font-display);font-size:20px;color:#4ade80;align-self:center">VS</div>
      <div style="flex:1;min-width:200px;background:rgba(74,222,128,0.04);border:1px solid rgba(74,222,128,0.15);border-radius:8px;padding:14px;text-align:center">
        <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#4ade80;margin-bottom:10px">GIRLS</div>
        <div class="rp-portrait-row" style="justify-content:center">${teams.girls.map(n => {
          const isCrossover = teams.crossovers.some(c => c.name === n);
          return `<div style="position:relative">${rpPortrait(n, 'sm')}${isCrossover ? '<div style="position:absolute;top:-4px;right:-4px;font-size:8px;font-weight:700;color:#facc15;background:rgba(250,204,21,0.2);border-radius:3px;padding:0 3px">SWAP</div>' : ''}</div>`;
        }).join('')}</div>
      </div>
    </div>

    <div style="background:rgba(74,222,128,0.04);border:1px solid rgba(74,222,128,0.12);border-radius:8px;padding:14px;max-width:480px;margin:0 auto">
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#4ade80;margin-bottom:8px">THE RULES</div>
      <div style="font-size:11px;color:#8b949e;line-height:1.7">
        <div style="margin-bottom:4px"><span style="color:#4ade80;font-weight:700">9 courses</span> of disgusting food</div>
        <div style="margin-bottom:4px"><span style="color:#f85149;font-weight:700">ALL members</span> must eat — one refusal = team loses the course</div>
        <div style="margin-bottom:4px"><span style="color:#84cc16;font-weight:700">Chain vomit</span> spreads to BOTH teams</div>
        <div style="margin-bottom:4px"><span style="color:#facc15;font-weight:700">Tied?</span> Eat-off tiebreaker — cockroach smoothie shots</div>
        <div><span style="color:#2dd4bf;font-weight:700">Winners</span> get immunity + reward. Losers go to tribal.</div>
      </div>
    </div>
  </div>`;
  return html;
}

function rpBuildBrunchCabins(ep) {
  const br = ep.brunch;
  const teams = ep.brunchTeams;
  if (!br || !teams) return '';
  const uid = 'br-cabin-' + ep.num;

  const revealItems = [];

  ['boys', 'girls'].forEach(team => {
    const teamLabel = team.toUpperCase();
    const members = teams[team];
    const cohesion = br.teamCohesion[team];
    const cohPct = Math.round(cohesion * 100);
    const cohColor = cohesion > 0.6 ? '#4ade80' : cohesion > 0.3 ? '#facc15' : '#f85149';

    // Team header
    revealItems.push({ type: 'team-header', html: `<div style="background:rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.15);border-radius:8px;padding:14px;margin-bottom:12px;text-align:center">
      <div style="font-family:var(--font-display);font-size:16px;letter-spacing:3px;color:#4ade80">${teamLabel} CABIN</div>
      <div class="rp-portrait-row" style="justify-content:center;margin-top:8px">${members.map(n => rpPortrait(n, 'xs')).join('')}</div>
    </div>` });

    // Events
    (br.cabinEvents[team] || []).forEach(evt => {
      const borderColor = evt.badgeClass === 'red' ? 'rgba(248,81,73,0.2)' :
                          evt.badgeClass === 'gold' ? 'rgba(74,222,128,0.2)' : 'rgba(139,148,158,0.1)';
      let evtHtml = '';
      if (evt.players?.length) {
        evtHtml += `<div style="display:flex;gap:4px;margin-bottom:6px">${evt.players.slice(0, 3).map(n => rpPortrait(n, 'xs')).join('')}</div>`;
      }
      evtHtml += `<div style="font-size:12px;color:#d4d4c8;line-height:1.5">${evt.text}</div>`;
      if (evt.badgeText) {
        evtHtml += `<div style="margin-top:6px"><span style="font-size:9px;font-weight:700;letter-spacing:0.5px;padding:2px 6px;border-radius:3px;background:${evt.badgeClass === 'red' ? 'rgba(248,81,73,0.15)' : 'rgba(74,222,128,0.15)'};color:${evt.badgeClass === 'red' ? '#f85149' : '#4ade80'}">${evt.badgeText}</span></div>`;
      }
      revealItems.push({ type: 'cabin-event', html: `<div class="br-card-slam" style="background:rgba(26,33,24,0.6);border:1px solid ${borderColor};border-radius:8px;padding:12px;margin-bottom:8px">${evtHtml}</div>` });
    });

    // Cohesion bar
    revealItems.push({ type: 'cohesion', html: `<div style="margin-bottom:16px;padding:10px 14px;background:rgba(74,222,128,0.04);border:1px solid rgba(74,222,128,0.1);border-radius:6px">
      <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#8b949e;margin-bottom:6px">TEAM COHESION</div>
      <div style="height:8px;background:rgba(139,148,158,0.1);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${cohPct}%;background:${cohColor};border-radius:4px;transition:width 0.8s"></div>
      </div>
      <div style="font-size:10px;color:${cohColor};margin-top:4px;text-align:right">${cohPct}%</div>
    </div>` });
  });

  let html = `<div class="rp-page br-canteen" id="${uid}-page" data-su-revealed="0" data-su-total="${revealItems.length}">
    <div style="font-family:var(--font-display);font-size:20px;letter-spacing:3px;text-align:center;color:#4ade80;margin-bottom:16px">CABIN DYNAMICS</div>`;
  revealItems.forEach((item, i) => {
    html += `<div class="${uid}-item" style="display:none" data-idx="${i}">${item.html}</div>`;
  });
  html += `<div style="display:flex;gap:10px;justify-content:center;margin-top:16px;position:sticky;bottom:10px;z-index:5">
    <button class="rp-camp-toggle-btn" style="border-color:#4ade80;color:#4ade80;padding:8px 20px;font-size:12px" onclick="suRevealNext('${uid}')">NEXT \u25B6</button>
    <button class="rp-camp-toggle-btn" style="border-color:#484f58;color:#8b949e;padding:8px 16px;font-size:11px" onclick="suRevealAll('${uid}')">REVEAL ALL</button>
  </div></div>`;
  return html;
}
```

Note: The cabin dynamics screen reuses the `suRevealNext`/`suRevealAll` functions since they work with any `uid`-based reveal system.

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat(brunch): VP screens 1-2 — The Split + Cabin Dynamics with overdrive CSS"
```

---

### Task 8: VP Screen 3 (The Brunch) + Screen 4 (Aftermath)

**Files:**
- Modify: `simulator.html` — add VP builder functions for courses and results

- [ ] **Step 1: Add VP Screen 3 (The Brunch — 9 courses)**

Insert after `rpBuildBrunchCabins`:

Build `rpBuildBrunchCourses(ep)` — the main eating challenge VP. This is the largest VP screen. For each course:
- Dish reveal card with tray-slide animation, category color, stink lines
- Per-player results for both teams: portrait with result badge, reaction text
- Refusal stamp if refused, convinced moment if applicable
- Chain vomit cascade section if triggered
- Course score tally
- Cross-team break cards at courses 3 and 6
- Eat-off section at the end if applicable: two portraits, shot glass counter

Use the same sequential reveal pattern (`suRevealNext`/`suRevealAll`) with unique uid `'br-courses-' + ep.num`.

Category colors: `{ 'meat-gross': '#f85149', 'bug-gross': '#84cc16', 'texture-gross': '#a855f7', 'mystery-gross': '#facc15', 'morally-questionable': '#f97316' }`

Category emojis: `{ 'meat-gross': '\uD83E\uDD69', 'bug-gross': '\uD83E\uDD97', 'texture-gross': '\uD83E\uDEB1', 'mystery-gross': '\u2753', 'morally-questionable': '\uD83D\uDE22' }`

- [ ] **Step 2: Add VP Screen 4 (Aftermath + Results)**

Build `rpBuildBrunchResults(ep)` — final score, MVP, worst eater, post-challenge events.

- Final score: big slime-styled numbers with team labels
- Winning team: green confetti splatter visual (CSS animation)
- Losing team: grey-out with slime drip effect
- MVP eater card: portrait, badge, stats
- Worst eater card: portrait, badge
- Post-challenge cabin events (same card format as pre-challenge)
- Reward display

- [ ] **Step 3: Wire VP screens into assembly**

Find where Say Uncle VP screens are pushed (search for `rpBuildSayUncleAnnouncement`). Add after the Say Uncle block:

```javascript
  } else if (ep.isBrunchOfDisgustingness && ep.brunch) {
    vpScreens.push({ id:'br-split', label:'The Split', html: rpBuildBrunchSplit(ep) });
    vpScreens.push({ id:'br-cabins', label:'Cabins', html: rpBuildBrunchCabins(ep) });
    vpScreens.push({ id:'br-courses', label:'The Brunch', html: rpBuildBrunchCourses(ep) });
    vpScreens.push({ id:'br-results', label:'Results', html: rpBuildBrunchResults(ep) });
  }
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat(brunch): VP screens 3-4 — The Brunch courses + Aftermath with overdrive effects"
```

---

### Task 9: Cold open recap + integration cleanup

**Files:**
- Modify: `simulator.html` — cold open, any remaining integration

- [ ] **Step 1: Add cold open recap**

Find the Say Uncle cold open recap (search for `isSayUncle && prevEp.sayUncle`). Add after its closing brace:

```javascript
    if (prevEp.isBrunchOfDisgustingness && prevEp.brunch) {
      const _brData = prevEp.brunch;
      html += `<div style="background:rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.15);border-radius:8px;padding:10px 14px;margin-bottom:10px">
        <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:#4ade80;margin-bottom:6px">BRUNCH OF DISGUSTINGNESS</div>
        <div style="font-size:12px;color:#d4d4c8;margin-bottom:4px">${_brData.winningTeam === 'boys' ? 'Boys' : 'Girls'} won ${_brData.score.boys}-${_brData.score.girls} \u2014 ${_brData.mvpEater} was MVP</div>
        ${_brData.eatOff ? `<div style="font-size:11px;color:#facc15">Eat-off tiebreaker: ${_brData.eatOff.winner} drank ${Math.max(_brData.eatOff.boysShots, _brData.eatOff.girlsShots)} cockroach shots</div>` : ''}
        <div style="font-size:11px;color:#84cc16">${_brData.courses.filter(c => c.chainVomit?.trigger).length} chain vomit${_brData.courses.filter(c => c.chainVomit?.trigger).length !== 1 ? 's' : ''}</div>
      </div>`;
    }
```

- [ ] **Step 2: Verify all integration points**

Check that these are all wired up (from Task 2):
- Twist catalog entry
- applyTwist handler
- simulateEpisode dispatch
- updateChalRecord skip list
- Camp event boost
- patchEpisodeHistory
- Timeline tag
- Text backlog call
- VP screen assembly
- Cold open recap

Read each integration point to verify.

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat(brunch): cold open recap + integration verification"
```

---

### Task 10: Final integration test

- [ ] **Step 1: Open simulator in browser**

- [ ] **Step 2: Test the twist**

1. Configure a season, assign "Brunch of Disgustingness" to a post-merge episode
2. Run the simulation to that episode
3. Check VP screens: The Split, Cabin Dynamics, The Brunch, Aftermath
4. Check text backlog
5. Check cold open on the next episode
6. Check timeline tag
7. Verify immunity — losing team should be vulnerable at tribal

- [ ] **Step 3: Test edge cases**

1. All boys or all girls cast — verify crossover balancing
2. Small cast (4 players) — verify it works
3. Tied score — verify eat-off fires
4. With no-tribal twist — verify no tribal happens
5. With survival enabled — verify food restoration for winners

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "test: verify Brunch of Disgustingness end-to-end"
```
